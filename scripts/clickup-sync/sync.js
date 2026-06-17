// =============================================================================
// GitHub -> ClickUp Docs sync (v2) -- MULTI-DOC, DIFF-BASED, CONTENT-ONLY.
// =============================================================================
//
// WHAT THIS DOES
// --------------
// Mirrors changed markdown files under "PUBLISHED FOLDERS MASTER/" into one of
// FOUR ClickUp v3 Docs, routed by their top-level folder:
//
//   Blogs             -> doc 2kzmq3ge-4518  (added files go under a container page)
//   Marketing Related -> doc 2kzmq3ge-4498  (added files go under a container page)
//   Customer Related  -> doc 2kzmq3ge-4478  (added files go at the doc root)
//   Products Related  -> doc 2kzmq3ge-878   (added files go under a container page)
//
// The routing table lives in clickup-sync.config.json at the repo root.
//
// DIFF-BASED
// ----------
// This is NOT a full tree mirror. It only processes the list of files Git tells
// us changed (via the CHANGED_FILES env var, newline-separated, or argv). Each
// changed file is classified by DISK PRESENCE + MAP PRESENCE:
//
//   MODIFIED -> exists on disk AND already in the map  -> PUT (update content)
//   ADDED    -> exists on disk but NOT in the map       -> POST (create page)
//   DELETED  -> does NOT exist on disk                  -> warn + skip (no delete)
//
// CONTENT-ONLY UPDATE + TITLE PRESERVATION GUARANTEE
// --------------------------------------------------
// For MODIFIED files we PUT to .../pages/{pageId} with a body of ONLY:
//   { content, content_format: "text/md", content_edit_mode: "replace" }
// We DELIBERATELY NEVER send a `name` field on an update. ClickUp's v3 API
// preserves the page title byte-for-byte when `name` is omitted, so editors can
// rename pages in ClickUp and those titles survive every future content sync.
// (This is verified behaviour -- do not "helpfully" add a name to updates.)
//
// The markdown body is sent verbatim: YAML frontmatter is stripped via
// gray-matter, leading blank lines are trimmed, and nothing else is altered.
// Real #/##/###/#### heading hierarchy is preserved; we never convert bold to
// headings or do any other "clever" transformation.
//
// AUTH
// ----
// Token comes from CLICKUP_TOKEN env first (the GitHub Action), else a local
// fallback reading the `Clickup=` key from main.env. The token is NEVER
// hardcoded and NEVER printed. The ClickUp v3 auth header is the RAW token with
// NO "Bearer " prefix.
//
// REBASELINE MODE
// ---------------
//   node sync.js --rebaseline
// Does NO writes. GETs every page referenced by the map and reports which still
// exist (OK) vs which are missing / drifted (non-200). Prints a per-doc summary
// and always exits 0 (it is a report, not a gate).
//
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Repo root is two levels up from scripts/clickup-sync/.
const REPO_ROOT = path.resolve(__dirname, "..", "..");

// ---------------------------------------------------------------------------
// Config + map loading
// ---------------------------------------------------------------------------
const CONFIG_FILE = path.join(REPO_ROOT, "clickup-sync.config.json");
const MAP_FILE = path.join(__dirname, ".clickup-sync-map.json");

function loadConfig() {
  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch (err) {
    throw new Error(`Cannot read config ${CONFIG_FILE}: ${err.message}`);
  }
  if (!cfg.apiBase || !cfg.workspaceId || !cfg.routes) {
    throw new Error(`Config ${CONFIG_FILE} is missing apiBase/workspaceId/routes`);
  }
  return cfg;
}

const config = loadConfig();
const API_BASE = config.apiBase;
const WORKSPACE_ID = config.workspaceId;
const CONTENT_ROOT_NAME = config.contentRoot || "PUBLISHED FOLDERS MASTER";
const ROUTES = config.routes;
const CONTENT_ROOT_ABS = path.join(REPO_ROOT, CONTENT_ROOT_NAME);

// Map shape at runtime: { "<gh path>": { "docId": "...", "pageId": "..." } }
// where <gh path> is POSIX-style, relative to the content root
// (e.g. "Blogs/Some_Article.md"). If the file is absent, treat it as {}.
function loadMap() {
  try {
    return JSON.parse(fs.readFileSync(MAP_FILE, "utf8"));
  } catch {
    return {};
  }
}

// Persist the map with sorted keys, 2-space indent, trailing newline.
// Called after each create so the run is resumable.
function saveMap(map) {
  const ordered = {};
  for (const k of Object.keys(map).sort()) ordered[k] = map[k];
  fs.writeFileSync(MAP_FILE, JSON.stringify(ordered, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// Token (never printed). Mirrors the v1 getToken() pattern.
// ---------------------------------------------------------------------------
function getToken() {
  if (process.env.CLICKUP_TOKEN && process.env.CLICKUP_TOKEN.trim()) {
    return process.env.CLICKUP_TOKEN.trim();
  }
  // Local fallback: read from main.env (path may not exist in CI).
  const envPath =
    "C:/Users/User/OneDrive - ZenCleanz/ZENCLEANZ - MASTER FOLDER/AI WORKSPACE MASTER/main.env";
  try {
    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^Clickup=(.*)$/);
      if (m) return m[1].trim();
    }
  } catch {
    /* ignore */
  }
  return "";
}

const TOKEN = getToken();
if (!TOKEN) {
  console.error(
    "ERROR: No ClickUp token. Set CLICKUP_TOKEN env var (or main.env fallback)."
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Name + content helpers (copied verbatim from v1 sync.js)
// ---------------------------------------------------------------------------
function sanitizeName(name) {
  return name
    .replace(/[‘’‚‛]/g, "'") // smart single quotes
    .replace(/[“”„‟]/g, '"') // smart double quotes
    .replace(/[–—]/g, "-") // en/em dash
    .replace(/ /g, " ") // non-breaking space
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim();
}

function nameFromFilename(file) {
  const base = file.replace(/\.md$/i, "");
  return sanitizeName(base.replace(/_/g, " "));
}

// Returns { name, body } from a markdown file: name from frontmatter `title`
// (falling back to filename), body with the frontmatter block stripped and
// leading blank lines trimmed. The markdown body is otherwise verbatim.
function parseMarkdown(absPath, fileName) {
  const raw = fs.readFileSync(absPath, "utf8");
  let title = "";
  let body = raw;
  try {
    const parsed = matter(raw);
    body = parsed.content;
    if (parsed.data && typeof parsed.data.title === "string") {
      title = parsed.data.title;
    }
  } catch {
    // Malformed frontmatter: fall back to a manual strip of the first block.
    const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
    body = m ? raw.slice(m[0].length) : raw;
  }
  const name = title ? sanitizeName(title) : nameFromFilename(fileName);
  return {
    name: name || nameFromFilename(fileName),
    body: body.replace(/^\s+/, ""),
  };
}

// ---------------------------------------------------------------------------
// Changed-file input + path normalization
// ---------------------------------------------------------------------------
// Source order: CHANGED_FILES env (newline-separated) if set & non-empty, else
// argv (filtering out flags). Paths may arrive repo-relative
// ("PUBLISHED FOLDERS MASTER/Blogs/x.md") OR already content-root-relative.
// We normalize to a content-root-relative POSIX path used by both the map key
// and the routing table.
function getChangedFiles() {
  const env = process.env.CHANGED_FILES;
  let list;
  if (env && env.trim()) {
    list = env.split(/\r?\n/);
  } else {
    list = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  }
  return list.map((s) => s.trim()).filter(Boolean);
}

// Normalize to content-root-relative POSIX path.
function toContentRelative(p) {
  let rel = p.replace(/\\/g, "/").trim();
  // Strip a leading "PUBLISHED FOLDERS MASTER/" (the content root) if present.
  const prefix = CONTENT_ROOT_NAME.replace(/\\/g, "/") + "/";
  if (rel.startsWith(prefix)) rel = rel.slice(prefix.length);
  // Strip any leading "./" or "/".
  rel = rel.replace(/^\.?\//, "");
  return rel;
}

// ---------------------------------------------------------------------------
// HTTP with throttle + 429 backoff
// ---------------------------------------------------------------------------
const WRITE_DELAY_MS = 450; // throttle between writes (~ClickUp 100 req/min)
const GET_DELAY_MS = 120; // polite delay between GETs
const MAX_RETRIES = 6;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Single request helper used for both reads and writes. `bodyObj` undefined for
// GET. Honors Retry-After on 429; retries transient 5xx a few times.
async function apiRequest(method, url, bodyObj) {
  let attempt = 0;
  while (true) {
    attempt++;
    const opts = {
      method,
      headers: {
        Authorization: TOKEN, // RAW token, NO "Bearer " prefix
      },
    };
    if (bodyObj !== undefined) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(bodyObj);
    }
    const res = await fetch(url, opts);

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("retry-after") || "", 10);
      const backoff = Number.isFinite(retryAfter)
        ? retryAfter * 1000
        : Math.min(2000 * attempt, 15000);
      if (attempt > MAX_RETRIES) {
        throw new Error(`429 after ${MAX_RETRIES} retries: ${url}`);
      }
      console.log(`  rate-limited (429), backing off ${backoff}ms...`);
      await sleep(backoff);
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // Transient 5xx: retry a few times.
      if (res.status >= 500 && attempt <= MAX_RETRIES) {
        const backoff = Math.min(1500 * attempt, 10000);
        console.log(`  ${res.status} server error, retry in ${backoff}ms...`);
        await sleep(backoff);
        continue;
      }
      const err = new Error(
        `${method} ${url} -> ${res.status}: ${text.slice(0, 300)}`
      );
      err.status = res.status;
      throw err;
    }

    const text = await res.text();
    return text ? safeJson(text) : {};
  }
}

function safeJson(t) {
  try {
    return JSON.parse(t);
  } catch {
    return {};
  }
}

// POST create a page in a doc. parentPageId may be null/undefined -> omit it.
async function createPage(docId, parentPageId, name, content) {
  const body = {
    name,
    content: content || "",
    content_format: "text/md",
  };
  if (parentPageId) body.parent_page_id = parentPageId;
  const data = await apiRequest(
    "POST",
    `${API_BASE}/workspaces/${WORKSPACE_ID}/docs/${docId}/pages`,
    body
  );
  const id = data.id || (data.page && data.page.id);
  if (!id) throw new Error(`Create returned no id for "${name}"`);
  return id;
}

// PUT update a page's CONTENT ONLY. NEVER sends `name` -> title is preserved.
async function updatePageContent(docId, pageId, content) {
  await apiRequest(
    "PUT",
    `${API_BASE}/workspaces/${WORKSPACE_ID}/docs/${docId}/pages/${pageId}`,
    {
      content: content || "",
      content_format: "text/md",
      content_edit_mode: "replace",
    }
  );
  return pageId;
}

// GET a page (with markdown content) -- used by --rebaseline.
async function getPage(docId, pageId) {
  return apiRequest(
    "GET",
    `${API_BASE}/workspaces/${WORKSPACE_ID}/docs/${docId}/pages/${pageId}?content_format=text/md`,
    undefined
  );
}

// ---------------------------------------------------------------------------
// Classification helpers
// ---------------------------------------------------------------------------
// A changed file is excluded if its basename is index.md or any path segment
// is "assets".
function isExcluded(relPath) {
  const segments = relPath.split("/");
  if (segments.some((s) => s.toLowerCase() === "assets")) return true;
  if (path.basename(relPath).toLowerCase() === "index.md") return true;
  return false;
}

// ---------------------------------------------------------------------------
// Rebaseline mode (read-only drift report)
// ---------------------------------------------------------------------------
async function rebaseline() {
  const map = loadMap();
  const entries = Object.entries(map);
  console.log(`[rebaseline] checking ${entries.length} mapped page(s)...\n`);

  // Per-doc tallies + list of missing.
  const perDoc = {}; // docId -> { ok, missing }
  const missing = []; // { ghpath, docId, pageId, status }
  const tally = (docId, kind) => {
    if (!perDoc[docId]) perDoc[docId] = { ok: 0, missing: 0 };
    perDoc[docId][kind]++;
  };

  for (const [ghpath, ref] of entries) {
    const docId = ref && ref.docId;
    const pageId = ref && ref.pageId;
    if (!docId || !pageId) {
      console.warn(`  ?? ${ghpath} -> malformed map entry (missing docId/pageId)`);
      missing.push({ ghpath, docId, pageId, status: "malformed" });
      tally(docId || "(unknown)", "missing");
      continue;
    }
    try {
      const page = await getPage(docId, pageId);
      if (page && page.id) {
        tally(docId, "ok");
        // console-quiet on OK to keep the report readable; uncomment to trace:
        // console.log(`  ok  ${ghpath}`);
      } else {
        tally(docId, "missing");
        missing.push({ ghpath, docId, pageId, status: "no-id-in-response" });
        console.warn(`  MISSING ${ghpath} (doc ${docId} page ${pageId}) -> empty response`);
      }
    } catch (err) {
      tally(docId, "missing");
      const status = err.status || "ERR";
      missing.push({ ghpath, docId, pageId, status });
      console.warn(`  MISSING ${ghpath} (doc ${docId} page ${pageId}) -> ${status}`);
    }
    await sleep(GET_DELAY_MS);
  }

  // Map docId -> human label from routes, for a friendlier table.
  const docLabel = {};
  for (const [folder, r] of Object.entries(ROUTES)) {
    if (r && r.docId) docLabel[r.docId] = folder;
  }

  console.log("\n=========== REBASELINE REPORT ===========");
  console.log("Per doc (ok / missing):");
  for (const docId of Object.keys(perDoc).sort()) {
    const s = perDoc[docId];
    const label = docLabel[docId] ? ` (${docLabel[docId]})` : "";
    console.log(
      `  ${String(docId).padEnd(16)}${label.padEnd(20)} ok=${s.ok} missing=${s.missing}`
    );
  }
  if (missing.length) {
    console.log(`\nMissing / drift (${missing.length}):`);
    for (const m of missing) {
      console.log(`  [${m.status}] ${m.ghpath} -> doc ${m.docId} page ${m.pageId}`);
    }
  } else {
    console.log("\nNo drift detected. All mapped pages still exist.");
  }
  console.log("=========================================");

  // Always exit 0 -- this is a report, not a gate.
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Main sync (diff-based, content-only)
// ---------------------------------------------------------------------------
async function syncChanged() {
  const map = loadMap();
  const changed = getChangedFiles();

  if (!changed.length) {
    console.log("No changed files provided (CHANGED_FILES env / argv empty). Nothing to do.");
    return;
  }

  console.log(`[sync] ${changed.length} changed path(s) to classify.\n`);

  // Stats, broken down per top-level folder (which maps 1:1 to a doc).
  const stats = { updated: 0, created: 0, skipped: 0, deletedWarned: 0 };
  const perFolder = {}; // topFolder -> { updated, created, skipped, deletedWarned }
  const bump = (topFolder, kind) => {
    if (!perFolder[topFolder]) {
      perFolder[topFolder] = { updated: 0, created: 0, skipped: 0, deletedWarned: 0 };
    }
    perFolder[topFolder][kind]++;
    stats[kind]++;
  };

  for (const rawPath of changed) {
    const relPath = toContentRelative(rawPath);
    const topFolder = relPath.split("/")[0];

    // Route check: skip anything not under one of the 4 routed folders.
    const route = ROUTES[topFolder];
    if (!route) {
      console.log(`skip (not routed): ${relPath}`);
      bump(topFolder || "(unrouted)", "skipped");
      continue;
    }

    // Exclusions: index.md and anything under assets/.
    if (isExcluded(relPath)) {
      console.log(`skip (excluded index.md/assets): ${relPath}`);
      bump(topFolder, "skipped");
      continue;
    }

    const absPath = path.join(CONTENT_ROOT_ABS, relPath);
    const existsOnDisk = fs.existsSync(absPath);
    const inMap = Object.prototype.hasOwnProperty.call(map, relPath);

    // ---- DELETED: not on disk -> warn + skip (ClickUp v3 returns 405 on delete)
    if (!existsOnDisk) {
      console.warn(
        `DELETED on disk: ${relPath} -> ClickUp page NOT deleted ` +
          `(v3 returns 405 on page delete; remove manually if desired).`
      );
      bump(topFolder, "deletedWarned");
      continue;
    }

    // ---- MODIFIED: on disk AND in map -> content-only PUT (title preserved)
    if (inMap) {
      const ref = map[relPath];
      const docId = ref && ref.docId;
      const pageId = ref && ref.pageId;
      if (!docId || !pageId) {
        console.warn(`skip (malformed map entry, no docId/pageId): ${relPath}`);
        bump(topFolder, "skipped");
        continue;
      }
      const { body } = parseMarkdown(absPath, path.basename(absPath));
      console.log(`[update] ${relPath} -> doc ${docId} page ${pageId}`);
      await updatePageContent(docId, pageId, body);
      bump(topFolder, "updated");
      await sleep(WRITE_DELAY_MS);
      continue;
    }

    // ---- ADDED: on disk but NOT in map -> POST create, then persist map
    const { name, body } = parseMarkdown(absPath, path.basename(absPath));
    const parentPageId = route.containerPageId || null; // null -> doc root
    const newId = await createPage(route.docId, parentPageId, name, body);
    map[relPath] = { docId: route.docId, pageId: newId };
    saveMap(map); // resumable: persist immediately after each create
    console.log(
      `[create] ${relPath} -> doc ${route.docId} page ${newId}` +
        (parentPageId ? ` (under ${parentPageId})` : " (doc root)")
    );
    bump(topFolder, "created");
    await sleep(WRITE_DELAY_MS);
  }

  // Final persist (idempotent; creates already persisted incrementally).
  saveMap(map);

  // Summary.
  console.log("\n=========== SYNC SUMMARY ===========");
  console.log(`Updated:        ${stats.updated}`);
  console.log(`Created:        ${stats.created}`);
  console.log(`Skipped:        ${stats.skipped}`);
  console.log(`Deleted-warned: ${stats.deletedWarned}`);
  console.log("Per top-level folder (doc):");
  for (const k of Object.keys(perFolder).sort()) {
    const s = perFolder[k];
    const docId = ROUTES[k] ? ROUTES[k].docId : "-";
    console.log(
      `  ${k.padEnd(20)} doc=${String(docId).padEnd(14)} ` +
        `upd=${s.updated} new=${s.created} skip=${s.skipped} del=${s.deletedWarned}`
    );
  }
  console.log("====================================");
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------
async function main() {
  if (process.argv.includes("--rebaseline")) {
    await rebaseline();
    return;
  }
  await syncChanged();
}

main().catch((err) => {
  console.error("SYNC FAILED:", err.message);
  process.exit(1);
});
