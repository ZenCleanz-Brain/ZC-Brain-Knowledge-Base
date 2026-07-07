// =============================================================================
// ClickUp Blogs -> KB (repo) -> ElevenLabs sub-agent sync -- NEW-BLOGS-ONLY.
// =============================================================================
//
// WHAT THIS DOES
// --------------
// Reads blog "blocks" from a ClickUp list, and for each block that is NOT yet
// known (not already a repo .md AND not already attached to the target
// ElevenLabs sub-agent node), it will:
//   1. write the blog markdown to  PUBLISHED FOLDERS MASTER/Blogs/<Title>.md
//   2. POST it to the ElevenLabs knowledge base  (/knowledge-base/file)
//   3. append {type:file,name,id,usage_mode:auto} to the TARGET node's
//      additional_knowledge_base and PATCH the agent ON THE RESOLVED BRANCH.
//
// Scope v1: CREATE-ONLY. No update-existing, no delete. Conservative dedup:
// if a close match already exists, the block is treated as KNOWN and skipped.
//
// MODES
// -----
//   node sync.js                 -> DRY-RUN (default). Reads only. Writes NOTHING.
//   node sync.js --dry-run       -> same as default (explicit).
//   node sync.js --limit 1       -> only consider the first N eligible NEW blocks.
//   node sync.js --live          -> actually write files + create KB docs + PATCH.
//                                    REFUSES unless config elevenlabs.targetConfirmed === true.
//   node sync.js --live --commit -> additionally `git add`+commit the new .md and
//                                    state file (never pushes).
//
// SAFETY
// ------
// * DRY-RUN IS THE DEFAULT. You must pass --live to touch anything.
// * --live still refuses to PATCH until config.elevenlabs.targetConfirmed=true,
//   so the live customer-facing agent is never written by accident.
// * Branch is resolved every run ("read latest branch always"): GET /branches,
//   use results[0].id. The n8n flow that works uses exactly this.
// * Neither API token is ever printed.
//
// AUTH
// ----
//   ElevenLabs: ELEVENLABS_API_KEY env, else Team-Portal/.env key ELEVENLABS_API_KEY.
//               Header: xi-api-key: <key>. NO "Bearer".
//   ClickUp:    CLICKUP_TOKEN env, else main.env key `Clickup=`.
//               Header: Authorization: <raw token>. NO "Bearer".
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Repo root is two levels up from scripts/clickup-blog-sync/.
const REPO_ROOT = path.resolve(__dirname, "..", "..");

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------
const ARGV = process.argv.slice(2);
const LIVE = ARGV.includes("--live");
const DRY_RUN = !LIVE; // dry-run unless --live is explicitly given
const DO_COMMIT = ARGV.includes("--commit");
const LIMIT = (() => {
  const i = ARGV.indexOf("--limit");
  if (i >= 0 && ARGV[i + 1] && /^\d+$/.test(ARGV[i + 1])) return parseInt(ARGV[i + 1], 10);
  return Infinity;
})();
// --title <substr>: restrict the eligible NEW pool to blocks whose title
// contains this substring (case-insensitive). Lets you pick a specific block
// for the one-block test instead of relying on list order.
const TITLE_FILTER = (() => {
  const i = ARGV.indexOf("--title");
  return i >= 0 && ARGV[i + 1] ? ARGV[i + 1] : null;
})();
// --exclude-task <id[,id...]>: never create these ClickUp tasks, and never let
// them seed the dedup index (so excluding one duplicate lets its sibling sync).
const EXCLUDE_TASKS = (() => {
  const i = ARGV.indexOf("--exclude-task");
  if (i >= 0 && ARGV[i + 1]) {
    return new Set(ARGV[i + 1].split(",").map((s) => s.trim()).filter(Boolean));
  }
  return new Set();
})();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CONFIG_FILE = path.join(REPO_ROOT, "clickup-blog-sync.config.json");
function loadConfig() {
  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch (err) {
    throw new Error(`Cannot read config ${CONFIG_FILE}: ${err.message}`);
  }
  for (const k of ["clickup", "elevenlabs", "blogsDir", "stateFile"]) {
    if (!cfg[k]) throw new Error(`Config missing "${k}"`);
  }
  return cfg;
}
const config = loadConfig();
const BLOGS_ABS = path.join(REPO_ROOT, config.blogsDir);
const STATE_ABS = path.join(REPO_ROOT, config.stateFile);
// Safety guards (see clickup-blog-sync.config.json):
// - MAX_CONTENT: never auto-attach a block bigger than this; skip for review.
// - PER_RUN_CAP: max NEW blocks created per run when no explicit --limit given.
const MAX_CONTENT = Number.isFinite(config.maxContentChars) ? config.maxContentChars : Infinity;
const PER_RUN_CAP = Number.isFinite(config.maxPerRun) ? config.maxPerRun : Infinity;

// ---------------------------------------------------------------------------
// Tokens (never printed)
// ---------------------------------------------------------------------------
function readEnvFileValue(absPath, key) {
  try {
    const raw = fs.readFileSync(absPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(new RegExp(`^${key}=(.*)$`));
      if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* ignore */
  }
  return "";
}
function getElevenLabsKey() {
  if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim()) {
    return process.env.ELEVENLABS_API_KEY.trim();
  }
  return readEnvFileValue(path.join(REPO_ROOT, "Team-Portal", ".env"), "ELEVENLABS_API_KEY");
}
function getClickupToken() {
  if (process.env.CLICKUP_TOKEN && process.env.CLICKUP_TOKEN.trim()) {
    return process.env.CLICKUP_TOKEN.trim();
  }
  const mainEnv =
    "C:/Users/User/OneDrive - ZenCleanz/ZENCLEANZ - MASTER FOLDER/AI WORKSPACE MASTER/main.env";
  return readEnvFileValue(mainEnv, "Clickup");
}
const EL_KEY = getElevenLabsKey();
const CU_TOKEN = getClickupToken();

// ---------------------------------------------------------------------------
// Name normalization
// ---------------------------------------------------------------------------
// sanitizeName mirrors scripts/clickup-sync/sync.js so filenames match the repo.
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
// Title -> repo filename: sanitize, make Windows-safe, spaces -> underscores.
// Windows forbids  < > : " / \ | ? *  in filenames. We map ":" to " - " to
// match the repo's existing convention (e.g. "Body - Supporting"), and drop
// the rest. Legal hyphens are left intact so "HEALTH-SCARE" is preserved.
function filenameFromTitle(title) {
  const clean = sanitizeName(String(title || "").trim())
    .replace(/\s*:\s*/g, " - ")
    .replace(/[<>"/\\|?*]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.replace(/ /g, "_") + ".md";
}
// normKey: a loose comparison key so "The_Healing_Crisis_(BLOG).md",
// "the healing crisis (blog)" and "The Healing Crisis  (BLOG)" all collapse to
// the same thing. lowercase, strip .md, drop punctuation, unify separators.
function normKey(s) {
  return sanitizeName(String(s || ""))
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/[_\s]+/g, " ")
    .replace(/[^a-z0-9 ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
// Two keys per name: loose (single-spaced words) and tight (no spaces at all).
// tight catches spacing/punctuation drift like "5 element" vs "5-Element".
const keyLoose = (s) => normKey(s);
const keyTight = (s) => normKey(s).replace(/ /g, "");
// Register a name under both keys (first source wins).
function addKnown(map, name, src) {
  const l = keyLoose(name);
  const t = keyTight(name);
  if (l && !map.has("L:" + l)) map.set("L:" + l, src);
  if (t && !map.has("T:" + t)) map.set("T:" + t, src);
}
// Return the source label of a match, or null. Exact on tight or loose first,
// then a conservative loose-substring (shorter side >= 12 chars).
function matchKnown(map, name) {
  const l = keyLoose(name);
  const t = keyTight(name);
  if (t && map.has("T:" + t)) return map.get("T:" + t);
  if (l && map.has("L:" + l)) return map.get("L:" + l);
  if (l && l.length >= 12) {
    for (const [k, src] of map) {
      if (!k.startsWith("L:")) continue;
      const kk = k.slice(2);
      const shorter = l.length <= kk.length ? l : kk;
      if (shorter.length >= 12 && (kk.includes(l) || l.includes(kk))) return src;
    }
  }
  // Space-insensitive substring: catches "5 element" vs "5-Element" drift.
  if (t && t.length >= 15) {
    for (const [k, src] of map) {
      if (!k.startsWith("T:")) continue;
      const kk = k.slice(2);
      const shorter = t.length <= kk.length ? t : kk;
      if (shorter.length >= 15 && (kk.includes(t) || t.includes(kk))) return src;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// HTTP helpers (throttled)
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function elGet(url) {
  const res = await fetch(url, { headers: { "xi-api-key": EL_KEY } });
  if (!res.ok) throw new Error(`GET ${scrub(url)} -> ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}
async function cuGet(url) {
  const res = await fetch(url, { headers: { Authorization: CU_TOKEN } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}
function scrub(u) {
  return u; // urls here carry no secrets, but keep a hook for safety
}

// ---------------------------------------------------------------------------
// ClickUp: fetch all blog tasks (paginated)
// ---------------------------------------------------------------------------
async function fetchClickupBlogs() {
  const { apiBase, listId } = config.clickup;
  const out = [];
  for (let page = 0; page < 50; page++) {
    const url =
      `${apiBase}/list/${listId}/task?include_closed=true` +
      `&include_markdown_description=true&page=${page}`;
    const data = await cuGet(url);
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    out.push(...tasks);
    if (data.last_page || tasks.length === 0) break;
    await sleep(150);
  }
  return out.map((t) => ({
    id: t.id,
    title: String(t.name || "").trim(),
    status: t.status && t.status.status,
    content:
      (typeof t.markdown_description === "string" && t.markdown_description) ||
      (typeof t.text_content === "string" && t.text_content) ||
      (typeof t.description === "string" && t.description) ||
      "",
  }));
}

// ---------------------------------------------------------------------------
// ElevenLabs: resolve branch, fetch agent, read target node KB
// ---------------------------------------------------------------------------
async function resolveBranchId() {
  const { apiBase, agentId } = config.elevenlabs;
  const data = await elGet(`${apiBase}/v1/convai/agents/${agentId}/branches`);
  const results = Array.isArray(data.results) ? data.results : [];
  if (!results.length) throw new Error("No branches returned for agent");
  return { branchId: results[0].id, branch: results[0], total: data.meta && data.meta.total };
}
async function fetchAgent(branchId) {
  const { apiBase, agentId } = config.elevenlabs;
  return elGet(`${apiBase}/v1/convai/agents/${agentId}?branch_id=${branchId}`);
}
function getNode(agent, nodeId) {
  const nodes = (agent.workflow && agent.workflow.nodes) || {};
  return nodes[nodeId];
}

// ---------------------------------------------------------------------------
// State file (idempotency): clickup task.id -> {filename, elevenLabsDocId, syncedAt}
// ---------------------------------------------------------------------------
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_ABS, "utf8"));
  } catch {
    return {};
  }
}
function saveState(state) {
  const ordered = {};
  for (const k of Object.keys(state).sort()) ordered[k] = state[k];
  fs.mkdirSync(path.dirname(STATE_ABS), { recursive: true });
  fs.writeFileSync(STATE_ABS, JSON.stringify(ordered, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// Dedup: is a block already known?
// ---------------------------------------------------------------------------
function buildKnownIndex(agent, targetNodeId, state) {
  const known = new Map(); // "L:"/"T:"+key -> source label
  // 1) existing repo blog files
  let repoFiles = [];
  try {
    repoFiles = fs.readdirSync(BLOGS_ABS).filter((f) => f.toLowerCase().endsWith(".md"));
  } catch {
    /* dir may not exist yet */
  }
  for (const f of repoFiles) addKnown(known, f, `repo:${f}`);
  // 2) docs already attached to the target node
  const node = getNode(agent, targetNodeId);
  const kb = (node && node.additional_knowledge_base) || [];
  for (const d of kb) addKnown(known, d.name, `node:${d.name}`);
  // 3) anything we've already synced (by task id handled separately)
  for (const [taskId, rec] of Object.entries(state)) {
    if (rec && rec.filename) addKnown(known, rec.filename, `state:${taskId}`);
  }
  return { known, repoFilesCount: repoFiles.length, nodeKbCount: kb.length };
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------
function classify(tasks, knownIndex, state) {
  const known = knownIndex.known;
  const rows = [];
  for (const t of tasks) {
    const filename = filenameFromTitle(t.title);
    let status = "NEW";
    let reason = "";
    if (EXCLUDE_TASKS.has(t.id)) {
      // Skip entirely and do NOT seed the dedup index.
      rows.push({ ...t, filename, statusClass: "EXCLUDED", reason: "--exclude-task" });
      continue;
    }
    if (state[t.id]) {
      status = "KNOWN";
      reason = `state (task ${t.id} synced ${state[t.id].syncedAt || "?"})`;
    } else {
      const match = matchKnown(known, t.title);
      if (match) {
        status = "KNOWN";
        reason = match;
      } else if (!t.content || !t.content.trim()) {
        status = "SKIP";
        reason = "empty content (no markdown_description)";
      } else if ((t.content || "").length > MAX_CONTENT) {
        // Safety guard: never auto-attach an oversized block. Skip for review,
        // and don't seed the dedup index (a smaller sibling can still sync).
        status = "SKIP";
        reason = `oversize (${t.content.length} chars > ${MAX_CONTENT}) — review manually`;
      } else {
        // NEW: register it so a later duplicate block in the SAME batch is
        // caught as KNOWN (source "batch:") instead of creating a near-dupe.
        addKnown(known, t.title, `batch:${filename}`);
      }
    }
    rows.push({ ...t, filename, statusClass: status, reason });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// LIVE write path (per eligible NEW block)
// ---------------------------------------------------------------------------
async function elCreateDoc(filename, bytes) {
  const { apiBase } = config.elevenlabs;
  const fd = new FormData();
  fd.append("file", new Blob([bytes], { type: "text/markdown" }), filename);
  fd.append("name", filename);
  const res = await fetch(`${apiBase}/v1/convai/knowledge-base/file`, {
    method: "POST",
    headers: { "xi-api-key": EL_KEY },
    body: fd,
  });
  if (!res.ok) throw new Error(`create doc -> ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  if (!data.id) throw new Error(`create doc returned no id for ${filename}`);
  return data.id;
}
async function elPatchAgent(branchId, workflow) {
  const { apiBase, agentId } = config.elevenlabs;
  const res = await fetch(`${apiBase}/v1/convai/agents/${agentId}?branch_id=${branchId}`, {
    method: "PATCH",
    headers: { "xi-api-key": EL_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ workflow }),
  });
  if (!res.ok) throw new Error(`PATCH agent -> ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

async function runLive(eligible, branchId, agent, state) {
  const targetNodeId = config.elevenlabs.targetNodeId;
  if (config.elevenlabs.targetConfirmed !== true) {
    console.error(
      "\nREFUSING to write: config.elevenlabs.targetConfirmed is not true.\n" +
        "Confirm the target branch + node with the user, set targetConfirmed=true, then re-run --live."
    );
    process.exit(2);
  }
  const created = [];
  for (const row of eligible) {
    // 1) write the .md into the repo Blogs dir
    const absMd = path.join(BLOGS_ABS, row.filename);
    fs.mkdirSync(BLOGS_ABS, { recursive: true });
    fs.writeFileSync(absMd, row.content);
    console.log(`[write] ${config.blogsDir}/${row.filename}`);

    // 2) create the KB doc
    const docId = await elCreateDoc(row.filename, Buffer.from(row.content, "utf8"));
    console.log(`[kb]    created ${row.filename} -> ${docId}`);

    // 3) re-read agent fresh, append to target node KB, PATCH
    const freshBranch = (await resolveBranchId()).branchId;
    const fresh = await fetchAgent(freshBranch);
    const node = getNode(fresh, targetNodeId);
    if (!node) throw new Error(`target node ${targetNodeId} not found on branch ${freshBranch}`);
    node.additional_knowledge_base = node.additional_knowledge_base || [];
    node.additional_knowledge_base.push({
      type: "file",
      name: row.filename,
      id: docId,
      usage_mode: "auto",
    });
    const patched = await elPatchAgent(freshBranch, fresh.workflow);
    console.log(`[patch] attached to ${config.elevenlabs.targetNodeLabel} -> version ${patched.version_id || "?"}`);

    // 4) record state immediately (resumable)
    state[row.id] = {
      filename: row.filename,
      elevenLabsDocId: docId,
      syncedAt: new Date().toISOString(),
    };
    saveState(state);
    created.push({ ...row, docId });
    await sleep(500);
  }

  if (DO_COMMIT && created.length) {
    try {
      const files = created.map((r) => path.join(config.blogsDir, r.filename));
      files.push(config.stateFile);
      execFileSync("git", ["add", ...files], { cwd: REPO_ROOT, stdio: "inherit" });
      execFileSync("git", ["commit", "-m", `feat(blog-sync): add ${created.length} new blog(s) to KB + ${config.elevenlabs.targetNodeLabel}`], {
        cwd: REPO_ROOT,
        stdio: "inherit",
      });
      console.log(`[git]   committed ${created.length} file(s) (not pushed)`);
    } catch (e) {
      console.warn(`[git]   commit skipped: ${e.message}`);
    }
  }
  return created;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (!EL_KEY) throw new Error("No ElevenLabs key (ELEVENLABS_API_KEY env or Team-Portal/.env).");
  if (!CU_TOKEN) throw new Error("No ClickUp token (CLICKUP_TOKEN env or main.env Clickup=).");

  console.log("=== ClickUp Blogs -> KB -> ElevenLabs sync ===");
  console.log(`mode: ${DRY_RUN ? "DRY-RUN (no writes)" : "LIVE"}${LIMIT !== Infinity ? `  limit=${LIMIT}` : ""}`);
  console.log(`agent: ${config.elevenlabs.agentName} (${config.elevenlabs.agentId})`);

  // Resolve branch + read agent (read-only)
  const { branchId, branch, total } = await resolveBranchId();
  console.log(`branch: ${branch.name} (${branchId})  [${total} branch(es); ${branch.current_live_percentage ?? "?"}% live]`);
  const agent = await fetchAgent(branchId);
  const targetNode = getNode(agent, config.elevenlabs.targetNodeId);
  if (!targetNode) {
    throw new Error(
      `Target node ${config.elevenlabs.targetNodeId} (${config.elevenlabs.targetNodeLabel}) not found on branch ${branchId}. ` +
        `Aborting so nothing lands in the wrong place.`
    );
  }
  console.log(`target node: ${targetNode.label} (${config.elevenlabs.targetNodeId})  confirmed=${config.elevenlabs.targetConfirmed === true}`);

  // Fetch ClickUp blocks + build known index
  const tasks = await fetchClickupBlogs();
  const state = loadState();
  const knownIndex = buildKnownIndex(agent, config.elevenlabs.targetNodeId, state);
  console.log(
    `\nsources: clickup blocks=${tasks.length}, repo blog files=${knownIndex.repoFilesCount}, ` +
      `target-node docs=${knownIndex.nodeKbCount}, state entries=${Object.keys(state).length}`
  );

  const rows = classify(tasks, knownIndex, state);
  const news = rows.filter((r) => r.statusClass === "NEW");
  const knowns = rows.filter((r) => r.statusClass === "KNOWN");
  const skips = rows.filter((r) => r.statusClass === "SKIP");
  const excluded = rows.filter((r) => r.statusClass === "EXCLUDED");
  if (excluded.length) {
    console.log(`\n=== EXCLUDED (--exclude-task) ===`);
    excluded.forEach((r) => console.log(`  - "${r.title}" (${r.id}) [${(r.content || "").length} chars]`));
  }

  const src = (r) => (r.reason.split(":")[0] || "?");
  const bySrc = knowns.reduce((a, r) => ((a[src(r)] = (a[src(r)] || 0) + 1), a), {});

  console.log(`\n--- CLASSIFICATION ---`);
  console.log(`NEW (would create): ${news.length}`);
  console.log(`KNOWN (skip)      : ${knowns.length}   ${JSON.stringify(bySrc)}`);
  console.log(`SKIP (empty)      : ${skips.length}`);

  const batchDups = knowns.filter((r) => r.reason.startsWith("batch:"));
  if (batchDups.length) {
    console.log(`\n=== DUPLICATE blocks within ClickUp (skipped as intra-batch dupes) ===`);
    batchDups.forEach((r) => console.log(`  - "${r.title}" (${r.id}) -> already covered by ${r.reason}`));
  }

  if (news.length) {
    console.log(`\n=== NEW blocks (would be created) ===`);
    news.forEach((r, i) => {
      console.log(`${i + 1}. "${r.title}"`);
      console.log(`     -> ${config.blogsDir}/${r.filename}   [${(r.content || "").length} chars]`);
    });
  }
  if (skips.length) {
    console.log(`\n=== SKIP (not created) ===`);
    skips.forEach((r) => console.log(`  - "${r.title}" (${r.id}) — ${r.reason}`));
  }

  let pool = news;
  if (TITLE_FILTER) {
    pool = news.filter((r) => r.title.toLowerCase().includes(TITLE_FILTER.toLowerCase()));
    console.log(`\n--title "${TITLE_FILTER}" -> ${pool.length} matching NEW block(s).`);
  }
  // Effective cap: an explicit --limit wins; otherwise the config per-run guard.
  const effLimit = LIMIT !== Infinity ? LIMIT : PER_RUN_CAP;
  const eligible = pool.slice(0, effLimit);
  if (effLimit !== Infinity && pool.length > eligible.length) {
    console.log(`\ncap=${effLimit} -> ${eligible.length} this run; ${pool.length - eligible.length} will sync on the next run.`);
  } else if (effLimit !== Infinity) {
    console.log(`\ncap=${effLimit} -> ${eligible.length} eligible this run.`);
  }

  if (DRY_RUN) {
    console.log(`\nDRY-RUN complete. Nothing was written. Re-run with --live (after target confirmed) to apply.`);
    return;
  }

  console.log(`\nLIVE: processing ${eligible.length} block(s)...`);
  const created = await runLive(eligible, branchId, agent, state);
  console.log(`\nLIVE complete. Created ${created.length} blog doc(s).`);
}

main().catch((err) => {
  console.error("\nSYNC FAILED:", err.message);
  process.exit(1);
});
