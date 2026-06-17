// =============================================================================
// match.js -- content-matcher for RE-BASELINING the GitHub -> ClickUp map.
// =============================================================================
//
// Purpose: re-derive a proposed map by comparing each local GitHub markdown
// file's content (frontmatter stripped) against the current content of every
// ClickUp page across the 4 routed docs, scoring by token Jaccard similarity.
// The best-scoring page is the proposed match for that file.
//
// This is a MINIMAL but working tool. It does NOT need to perfectly reproduce
// the original hand-built map; it just gives a usable starting point for a
// human to review. All thresholds below are HEURISTIC -- tune as needed.
//
// Output: a proposed-map JSON, in shape:
//   { "<ghpath>": { docId, pageId, pageName, score, jaccard, confidence } }
// where <ghpath> is content-root-relative POSIX (e.g. "Blogs/x.md").
//
// Usage:
//   node match.js            -> prints proposed map JSON to stdout
//   node match.js --write     -> ALSO writes clickup-sync-proposed-map.json
//                                here (next to match.js)
//
// Auth + routing + config are shared with sync.js conventions. The token is
// read from CLICKUP_TOKEN env (or the main.env fallback) and is NEVER printed.
// ClickUp v3 auth header is the RAW token with NO "Bearer " prefix.
//
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CONFIG_FILE = path.join(REPO_ROOT, "clickup-sync.config.json");
const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
const API_BASE = config.apiBase;
const WORKSPACE_ID = config.workspaceId;
const CONTENT_ROOT_NAME = config.contentRoot || "PUBLISHED FOLDERS MASTER";
const ROUTES = config.routes;
const CONTENT_ROOT_ABS = path.join(REPO_ROOT, CONTENT_ROOT_NAME);

// Heuristic thresholds (tune freely):
//   jaccard >= HIGH_THRESHOLD  -> "HIGH" confidence
//   else (with >0 tokens)      -> "UNCERTAIN"
//   file has 0 meaningful tokens-> "NO_MATCH"
const HIGH_THRESHOLD = 0.6;

const GET_DELAY_MS = 120; // polite delay between page-content GETs

// ---------------------------------------------------------------------------
// Token (never printed). Same pattern as sync.js / v1.
// ---------------------------------------------------------------------------
function getToken() {
  if (process.env.CLICKUP_TOKEN && process.env.CLICKUP_TOKEN.trim()) {
    return process.env.CLICKUP_TOKEN.trim();
  }
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
// HTTP (GET only here)
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiGet(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: TOKEN }, // RAW token, NO "Bearer " prefix
  });
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("retry-after") || "", 10);
    const backoff = Number.isFinite(retryAfter) ? retryAfter * 1000 : 2000;
    await sleep(backoff);
    return apiGet(url);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${url} -> ${res.status}: ${text.slice(0, 200)}`);
  }
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

// GET a doc's top-level page tree (array of nested page objects).
async function getPageTree(docId) {
  const data = await apiGet(
    `${API_BASE}/workspaces/${WORKSPACE_ID}/docs/${docId}/pages`
  );
  // The endpoint returns an array; be tolerant of a wrapped { pages: [...] }.
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.pages)) return data.pages;
  return [];
}

// GET a single page's markdown content.
async function getPageContent(docId, pageId) {
  return apiGet(
    `${API_BASE}/workspaces/${WORKSPACE_ID}/docs/${docId}/pages/${pageId}?content_format=text/md`
  );
}

// ---------------------------------------------------------------------------
// Tree flatten (recursive via nested `pages` arrays)
// ---------------------------------------------------------------------------
function flattenPages(tree, out = []) {
  for (const node of tree || []) {
    if (node && node.id) out.push({ id: node.id, name: node.name || "" });
    if (node && Array.isArray(node.pages) && node.pages.length) {
      flattenPages(node.pages, out);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Tokenization + Jaccard
// ---------------------------------------------------------------------------
function tokenize(text) {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  );
}

function jaccard(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Strip frontmatter, return the markdown body.
function stripFrontmatter(absPath) {
  const raw = fs.readFileSync(absPath, "utf8");
  try {
    return matter(raw).content;
  } catch {
    const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
    return m ? raw.slice(m[0].length) : raw;
  }
}

// ---------------------------------------------------------------------------
// Local file walk (recursive .md collector; skip index.md + assets/)
// ---------------------------------------------------------------------------
function collectMarkdown(dir, parentRel, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.toLowerCase() === "assets") continue;
    const abs = path.join(dir, e.name);
    const rel = parentRel ? `${parentRel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      collectMarkdown(abs, rel, out);
    } else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) {
      if (e.name.toLowerCase() === "index.md") continue;
      out.push({ relPath: rel, absPath: abs });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const proposed = {}; // ghpath -> { docId, pageId, pageName, score, jaccard, confidence }

  for (const [topFolder, route] of Object.entries(ROUTES)) {
    const docId = route.docId;
    const folderAbs = path.join(CONTENT_ROOT_ABS, topFolder);

    // Local files for this folder (ghpath is content-root-relative, so it keeps
    // the topFolder prefix, e.g. "Blogs/x.md").
    const localFiles = collectMarkdown(folderAbs, topFolder, []);
    if (!localFiles.length) {
      console.error(`[match] ${topFolder}: no local .md files, skipping.`);
      continue;
    }

    // Fetch + tokenize every page in this doc.
    console.error(`[match] ${topFolder}: fetching ClickUp pages for doc ${docId}...`);
    const tree = await getPageTree(docId);
    const pages = flattenPages(tree);
    const pageTokens = []; // { id, name, tokens }
    for (const p of pages) {
      let content = "";
      try {
        const full = await getPageContent(docId, p.id);
        content = (full && full.content) || "";
      } catch (err) {
        console.error(`  warn: could not fetch page ${p.id}: ${err.message}`);
      }
      pageTokens.push({ id: p.id, name: p.name || "", tokens: tokenize(content) });
      await sleep(GET_DELAY_MS);
    }
    console.error(`[match] ${topFolder}: ${pages.length} pages, ${localFiles.length} local files.`);

    // Score each local file against every page; keep the best.
    for (const f of localFiles) {
      const body = stripFrontmatter(f.absPath);
      const fileTokens = tokenize(body);

      if (fileTokens.size === 0) {
        proposed[f.relPath] = {
          docId,
          pageId: null,
          pageName: null,
          score: 0,
          jaccard: 0,
          confidence: "NO_MATCH",
        };
        continue;
      }

      let best = { id: null, name: null, jac: 0 };
      for (const pt of pageTokens) {
        const jac = jaccard(fileTokens, pt.tokens);
        if (jac > best.jac) best = { id: pt.id, name: pt.name, jac };
      }

      const confidence =
        best.id === null
          ? "NO_MATCH"
          : best.jac >= HIGH_THRESHOLD
          ? "HIGH"
          : "UNCERTAIN";

      proposed[f.relPath] = {
        docId,
        pageId: best.id,
        pageName: best.name,
        score: Number(best.jac.toFixed(4)),
        jaccard: Number(best.jac.toFixed(4)),
        confidence,
      };
    }
  }

  // Sort keys for a stable, reviewable output.
  const ordered = {};
  for (const k of Object.keys(proposed).sort()) ordered[k] = proposed[k];
  const json = JSON.stringify(ordered, null, 2) + "\n";

  if (process.argv.includes("--write")) {
    const outFile = path.join(__dirname, "clickup-sync-proposed-map.json");
    fs.writeFileSync(outFile, json);
    console.error(`[match] wrote proposed map -> ${outFile}`);
  } else {
    // Proposed map goes to stdout; all progress logs go to stderr above.
    process.stdout.write(json);
  }
}

main().catch((err) => {
  console.error("MATCH FAILED:", err.message);
  process.exit(1);
});
