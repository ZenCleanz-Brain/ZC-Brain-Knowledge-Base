// One-way GitHub -> ClickUp Docs sync for the ZenCleanz Knowledge Base.
//
// Mirrors the folder tree under `PUBLISHED FOLDERS MASTER/` into a ClickUp v3
// Doc as nested pages. Each folder becomes a parent page; each .md file becomes
// a child page under its folder's page. The doc's existing root page is the
// parent of the top-level items, and the root `index.md` body is written into
// that root page itself.
//
// Idempotent: a committed `.clickup-sync-map.json` maps each source path to its
// ClickUp page id. On every run, known paths are PUT (updated in place) and new
// paths are POSTed (created), so re-runs never duplicate.
//
// Auth: token comes from the CLICKUP_TOKEN env var (used by the GitHub Action).
// For local runs, if CLICKUP_TOKEN is unset, the token is read from main.env as
// a fallback. The token value is never hardcoded and never printed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API_BASE = "https://api.clickup.com/api/v3";
const WORKSPACE_ID = "90182487566";
const DOC_ID = "2kzmq3ge-878";
const ROOT_PAGE_ID = "2kzmq3ge-578"; // existing "Product Information Hub" page

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Repo root is two levels up from scripts/clickup-sync/
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const CONTENT_ROOT = path.join(REPO_ROOT, "PUBLISHED FOLDERS MASTER");
const MAP_FILE = path.join(__dirname, ".clickup-sync-map.json");

// Special map key for the doc's root page content (from root index.md).
const ROOT_KEY = "__ROOT__";

// Throttle settings (ClickUp limits ~100 req/min).
const WRITE_DELAY_MS = 450;
const MAX_RETRIES = 6;

// Optional: scope to a single top-level subfolder for small tests.
// Set SYNC_ONLY="Customer Related" to mirror only that folder.
const SYNC_ONLY = process.env.SYNC_ONLY || "";

// ---------------------------------------------------------------------------
// Token (never printed)
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
// Map persistence
// ---------------------------------------------------------------------------
function loadMap() {
  try {
    return JSON.parse(fs.readFileSync(MAP_FILE, "utf8"));
  } catch {
    return {};
  }
}
function saveMap(map) {
  // Stable key order for clean diffs.
  const ordered = {};
  for (const k of Object.keys(map).sort()) ordered[k] = map[k];
  fs.writeFileSync(MAP_FILE, JSON.stringify(ordered, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// Name + content helpers
// ---------------------------------------------------------------------------
function sanitizeName(name) {
  return name
    .replace(/[‘’‚‛]/g, "'") // smart single quotes
    .replace(/[“”„‟]/g, '"') // smart double quotes
    .replace(/[–—]/g, "-") // en/em dash
    .replace(/ /g, " ") // non-breaking space
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCaseFolder(folderName) {
  const cleaned = sanitizeName(folderName.replace(/_/g, " "));
  // Preserve all-caps acronyms; title-case ordinary words.
  return cleaned
    .split(" ")
    .map((w) => {
      if (!w) return w;
      if (/^[A-Z0-9&+]{2,}$/.test(w)) return w; // already an acronym
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ")
    .trim();
}

function nameFromFilename(file) {
  const base = file.replace(/\.md$/i, "");
  return sanitizeName(base.replace(/_/g, " "));
}

// Returns { name, body } from a markdown file: name from frontmatter `title`
// (falling back to filename), body with the frontmatter block stripped.
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
  return { name: name || nameFromFilename(fileName), body: body.replace(/^\s+/, "") };
}

// Dedupe a page name within a given parent. Tracks used names per parent id.
const usedNames = new Map(); // parentId -> Set(lowercased names)
function dedupeName(parentId, name) {
  if (!usedNames.has(parentId)) usedNames.set(parentId, new Set());
  const used = usedNames.get(parentId);
  let candidate = name || "Untitled";
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${name} (${n})`;
    n++;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

// ---------------------------------------------------------------------------
// HTTP with throttle + 429 backoff
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiWrite(method, url, bodyObj) {
  let attempt = 0;
  while (true) {
    attempt++;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyObj),
    });
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
      throw new Error(`${method} ${url} -> ${res.status}: ${text.slice(0, 300)}`);
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

async function createPage(parentPageId, name, content) {
  const data = await apiWrite(
    "POST",
    `${API_BASE}/workspaces/${WORKSPACE_ID}/docs/${DOC_ID}/pages`,
    {
      parent_page_id: parentPageId,
      name,
      content: content || "",
      content_format: "text/md",
    }
  );
  const id = data.id || (data.page && data.page.id);
  if (!id) throw new Error(`Create returned no id for "${name}"`);
  return id;
}

async function updatePage(pageId, name, content) {
  await apiWrite(
    "PUT",
    `${API_BASE}/workspaces/${WORKSPACE_ID}/docs/${DOC_ID}/pages/${pageId}`,
    {
      name,
      content: content || "",
      content_format: "text/md",
      content_edit_mode: "replace",
    }
  );
  return pageId;
}

// ---------------------------------------------------------------------------
// Tree walk
// ---------------------------------------------------------------------------
// Build a deterministic list of nodes. Each node:
//   { type: 'folder'|'file', relPath, absPath, name, parentRel }
// relPath is POSIX-style relative to CONTENT_ROOT. Folders use their dir path;
// files use their file path. parentRel is "" for top-level (-> root page).
function walk(dir, parentRel, nodes) {
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.name.toLowerCase() !== "assets")
    .sort((a, b) => {
      // Folders before files, then alphabetical, for deterministic ordering.
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  for (const e of entries) {
    const abs = path.join(dir, e.name);
    const rel = parentRel ? `${parentRel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      nodes.push({
        type: "folder",
        relPath: rel,
        absPath: abs,
        parentRel,
        name: titleCaseFolder(e.name),
      });
      walk(abs, rel, nodes);
    } else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) {
      if (parentRel === "" && e.name.toLowerCase() === "index.md") continue; // root handled separately
      nodes.push({
        type: "file",
        relPath: rel,
        absPath: abs,
        parentRel,
        name: null, // resolved from frontmatter later
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (!fs.existsSync(CONTENT_ROOT)) {
    console.error(`ERROR: content root not found: ${CONTENT_ROOT}`);
    process.exit(1);
  }

  const map = loadMap();
  const stats = {
    created: 0,
    updated: 0,
    perFolder: {}, // topLevel -> { created, updated }
  };
  const bump = (topLevel, kind) => {
    if (!stats.perFolder[topLevel]) stats.perFolder[topLevel] = { created: 0, updated: 0 };
    stats.perFolder[topLevel][kind]++;
    stats[kind]++;
  };

  // 1) Root page: write root index.md body into ROOT_PAGE_ID.
  const rootIndex = path.join(CONTENT_ROOT, "index.md");
  if (fs.existsSync(rootIndex) && !SYNC_ONLY) {
    const { name, body } = parseMarkdown(rootIndex, "index.md");
    // Keep "Product Information Hub" unless index.md frontmatter gives a real
    // title. The filename-derived fallback is the generic "index", which we do
    // NOT want as the root page name (compare case-insensitively).
    const rootName =
      name && name.toLowerCase() !== "index" ? name : "Product Information Hub";
    map[ROOT_KEY] = ROOT_PAGE_ID;
    console.log(`[root] updating root page (${ROOT_PAGE_ID})`);
    await updatePage(ROOT_PAGE_ID, rootName, body);
    bump("(root)", "updated");
    saveMap(map);
    await sleep(WRITE_DELAY_MS);
  } else {
    map[ROOT_KEY] = ROOT_PAGE_ID;
  }

  // 2) Walk content tree.
  let nodes = [];
  walk(CONTENT_ROOT, "", nodes);

  if (SYNC_ONLY) {
    nodes = nodes.filter(
      (n) => n.relPath === SYNC_ONLY || n.relPath.startsWith(SYNC_ONLY + "/")
    );
    console.log(`SYNC_ONLY active: ${SYNC_ONLY} (${nodes.length} nodes)`);
  }

  // parentRel -> ClickUp page id (the page that children attach to).
  // "" maps to the doc root page.
  const parentIdFor = (parentRel) =>
    parentRel === "" ? ROOT_PAGE_ID : map[parentRel];

  for (const node of nodes) {
    const topLevel = node.relPath.split("/")[0];
    const parentId = parentIdFor(node.parentRel);
    if (!parentId) {
      throw new Error(
        `Missing parent page id for "${node.relPath}" (parentRel="${node.parentRel}"). ` +
          `Folders must be processed before children.`
      );
    }

    let name;
    let content;
    if (node.type === "folder") {
      name = node.name;
      content = ""; // folder pages are containers; keep empty
    } else {
      const parsed = parseMarkdown(node.absPath, path.basename(node.absPath));
      name = parsed.name;
      content = parsed.body;
    }
    name = dedupeName(parentId, name);

    const existingId = map[node.relPath];
    if (existingId) {
      console.log(`[update] ${node.relPath} -> ${existingId}`);
      await updatePage(existingId, name, content);
      bump(topLevel, "updated");
    } else {
      const newId = await createPage(parentId, name, content);
      map[node.relPath] = newId;
      console.log(`[create] ${node.relPath} -> ${newId}`);
      bump(topLevel, "created");
    }
    saveMap(map); // resumable after each write
    await sleep(WRITE_DELAY_MS);
  }

  saveMap(map);

  // 3) Summary.
  console.log("\n=========== SYNC SUMMARY ===========");
  console.log(`Total created: ${stats.created}`);
  console.log(`Total updated: ${stats.updated}`);
  console.log("Per top-level:");
  for (const k of Object.keys(stats.perFolder).sort()) {
    const s = stats.perFolder[k];
    console.log(`  ${k.padEnd(20)} created=${s.created} updated=${s.updated}`);
  }
  console.log("====================================");
}

main().catch((err) => {
  console.error("SYNC FAILED:", err.message);
  process.exit(1);
});
