# ClickUp Blogs → KB → ElevenLabs Sub-agent — Design Spec

Date: 2026-07-07
Status: Design approved (repo-first + scheduled scan + new-only). Build NOT yet started.
Owner: brain@zencleanz.com

## Goal

Automatically take **new** blog "blocks" authored in a ClickUp list, publish them into the
GitHub knowledge base as `.md`, upload them into the ElevenLabs knowledge base, and **attach
them to the correct sub-agent node** on the live "ZenCleanz Brain 1.06" agent — so new blogs
stop having to be added by hand and stop silently piling up.

Approved scope for v1: **create NEW blogs only** (no update-existing, no delete). Start by
testing with a **single** block end-to-end before enabling the full run.

## Chosen architecture (confirmed with user)

**Repo-first**, on a **scheduled scan** (GitHub Actions cron, ~every 3 days):

```
ClickUp list 901818826573 (blog blocks; content in markdown_description)
        │  scheduled scan (GitHub Action cron)
        ▼
For each block: normalize title → filename; is it already known?
        ├─ NEW    → write .md to PUBLISHED FOLDERS MASTER/Blogs/, commit/push
        │          → POST create doc in ElevenLabs KB
        │          → append {type:file,name,id} to target sub-agent node's KB
        │          → PATCH agent (on correct branch)
        └─ KNOWN  → skip (this is what prevents 41 duplicates)
```

Rationale: the repo (`PUBLISHED FOLDERS MASTER/`) is already the single source of truth for the
Team-Portal app and the existing GitHub→ClickUp-Docs mirror. Keeping blogs there too avoids a
third disconnected copy.

## Source: the ClickUp list

- List ID: `901818826573` (view URL `.../v/l/6-901818826573-1`), workspace `90182487566`.
- 41 tasks, all `status = published`. Each task = one blog article.
- **Content lives in the task's `markdown_description`** (fallback `text_content`/`description`).
- Task **name = article title**; custom fields present: `Department`, `SBP Stage` (not needed for v1).
- ⚠️ Task names often have **trailing spaces** (e.g. `"The Crossroad Between Wisdom and Science  "`) — trim before use.
- ClickUp API v2: `GET https://api.clickup.com/api/v2/list/901818826573/task?include_closed=true&include_markdown_description=true`
  - Auth header = **raw token, NO "Bearer " prefix**.
  - Token from `main.env` key `Clickup=` (same source the existing `scripts/clickup-sync` uses),
    or a `CLICKUP_TOKEN` GitHub secret in CI.
  - NOTE: the ClickUp MCP that Claude is connected to is **not authorized** for this workspace
    ("Team not authorized") — must use the API token, not the MCP.

## Destination: ElevenLabs agent — CRITICAL DETAILS

Live agent: `agent_4101kebd8snsff0az1775xyzhamc` ("ZenCleanz Brain 1.06").
API key: `Team-Portal/.env` → `ELEVENLABS_API_KEY`. Header `xi-api-key: <key>`.

### ⚠️ Branch handling is MANDATORY (biggest risk)

The agent has multiple branches and **they diverge in their node sets**:
- A plain `GET /v1/convai/agents/{id}` (no branch param) returned nodes: Main Routing,
  Product+TCM (31 docs), General FAQs (75 docs), **Shipping & Customer Service SOP (1 doc)** —
  and NO Blogs/Marketing nodes.
- The branch the working n8n flow uses, `agtbrch_3701kfdamf2rex1bhrsxmg0rxtwb`, has: Main Routing,
  Product+TCM (31), General FAQs (75), **General Wellness (Blogs) (30 docs)**,
  **Marketing Agent (3 docs)** — and NO Shipping node.
- `main_branch_id = agtbrch_3001kebd8tjsffrtcc8czyj6awh7`.

The n8n workflow resolves the branch every run (its sticky note: *"read latest branch always"*):
1. `GET /v1/convai/agents/{id}/branches` → use `results[0].id` as `branch_id`.
2. `GET /v1/convai/agents/{id}?branch_id={branch_id}`.
3. `PATCH /v1/convai/agents/{id}?branch_id={branch_id}`.

**ACTION FOR NEXT AGENT:** before any write, do a read-only branch inventory
(`GET .../branches`, then GET the agent per branch) and confirm with the user **which branch is
actually serving customers**, and therefore where new blog docs must land. Do NOT assume.

### ⚠️ Which node do blogs attach to? — CONFIRM WITH USER

User said "blogs go to General FAQs". But branch `agtbrch_3701…` has a dedicated
**"General Wellness (Blogs)"** node (`node_01kedgddtpe8jbf4xd2mkqmz1j`, 30 blog docs) that looks
like the semantically correct home. General FAQs node = `node_01kebdshtre03bzdwdfw7m5amr` (75 mixed docs).
Confirm the exact target node id (and on which branch) before writing.

### The proven create + attach mechanism (n8n verified it live)

Per doc, 3 API calls (all on the resolved branch):
1. **Create**: `POST /v1/convai/knowledge-base/file` (multipart: `file` = the .md bytes,
   `name` = filename) → returns a NEW `id`.
2. **Read**: `GET /v1/convai/agents/{id}?branch_id=X` → take target node's
   `additional_knowledge_base` array.
3. **Attach**: `PATCH /v1/convai/agents/{id}?branch_id=X` with body
   `{ "workflow": <ENTIRE workflow object> }` where only the target node's
   `additional_knowledge_base` has the new entry appended:
   `{ "type":"file", "name":"<Filename>.md", "id":"<newDocId>", "usage_mode":"auto" }`.
   - Send the COMPLETE workflow (all nodes + edges), modifying only the one node's KB array.
     This is the pattern n8n uses and it returns a new `version_id` on success.
   - (Update path, NOT in v1 scope: DELETE old doc `?force=true`, upload new, swap id. We only
     CREATE new for v1.)

Evidence it works: n8n's last run uploaded `RAINBOW_-_Protocol_&_FAQs` → new doc id
`9A8NQCQQfhnjeU41sofL` → swapped into the Product node → PATCH → new version. (Harmless; it
replaced an existing RAINBOW doc.)

## Matching / dedup (prevents duplicates)

Most of the 41 blocks already exist as repo files and/or KB docs (e.g. "When Wellness Became
What It Tried to Replace" is a block AND `When_Wellness_Became_What_It_Tried_to_Replace.md` AND a
General-FAQs/Blogs doc). So:

- Normalize: `title.trim()` → filename `Title_With_Underscores.md` (mirror existing repo naming:
  underscores for spaces; sanitize smart quotes/dashes/`&`→`and` like `scripts/clickup-sync/sync.js`
  `sanitizeName()`).
- A block is **NEW** only if its normalized filename is NOT present in `PUBLISHED FOLDERS MASTER/Blogs/`
  AND not already in the target node's `additional_knowledge_base` (compare normalized: lowercase,
  trim, strip `.md`). The n8n matcher also allows substring match — for create-only we want a
  conservative "treat as existing if a close match is found" to avoid accidental dupes.
- Persist a **state file** (like `scripts/clickup-sync/.clickup-sync-map.json`) mapping
  ClickUp `task.id` → `{ filename, elevenLabsDocId, contentHash, syncedAt }` so re-runs are
  idempotent and a create is never repeated.

## Components to build

1. `scripts/clickup-blog-sync/sync.js` (ES module, Node 20; mirror the style/auth/throttle of
   `scripts/clickup-sync/sync.js`). Modes:
   - `--dry-run` (DEFAULT for first use): report would-create / would-skip, write NOTHING.
   - `--limit 1` : process only the first eligible NEW block (the "test with 1" step).
   - live mode: create + commit + attach.
2. `clickup-blog-sync.config.json` at repo root: list id, workspace, target `agentId`, target
   `nodeId`, branch-resolution strategy, Blogs folder path.
3. `.github/workflows/clickup-blog-sync.yml`: `on: schedule (cron ~every 3 days) + workflow_dispatch`;
   secrets `CLICKUP_TOKEN`, `ELEVENLABS_API_KEY`; Node 20; runs `--dry-run` on manual dispatch,
   live on schedule (or gate live behind an input). Commits the state file back like the existing
   clickup-sync action does.
4. State file `scripts/clickup-blog-sync/.blog-sync-map.json`.

## Safety / rollout

- **Dry-run first**: build `--dry-run`, run it, review the create/skip list WITH the user.
- **Then test with exactly ONE** block end-to-end (`--limit 1`) and verify in the ElevenLabs UI
  that the doc appears attached to the intended node on the intended (live) branch.
- Only then enable the scheduled live run.
- Writes touch the LIVE customer-facing agent → confirm branch + node with user before any PATCH.

## Open questions for the user (answer before live writes)

1. Which **branch** is actually serving customers, and must new docs land there? (Do the
   read-only branch inventory first, then confirm.)
2. Which **node** do new blogs attach to — General FAQs (`node_01kebdshtre03bzdwdfw7m5amr`) or the
   dedicated General Wellness (Blogs) node (`node_01kedgddtpe8jbf4xd2mkqmz1j`)?
3. Cron cadence: every 3 days ok, or weekly?

## Key facts / paths

- ClickUp token: `main.env` → `Clickup=` (path: `.../AI WORKSPACE MASTER/main.env`).
- ElevenLabs key: `Team-Portal/.env` → `ELEVENLABS_API_KEY`.
- Repo blogs dir: `PUBLISHED FOLDERS MASTER/Blogs/`.
- Existing reference impl (GitHub→ClickUp Docs, opposite direction): `scripts/clickup-sync/sync.js`.
- Existing n8n reference (app→ElevenLabs UPDATE-only): `n8n-elevenlabs-auto-update/` +
  `docs/api-reference.md` (endpoints 1–5).
- The app→ElevenLabs n8n workflow is triggered by the Team-Portal approval webhook (`kb-update`),
  NOT by git push, and it only UPDATES docs already attached to a node. Our new sync is the
  missing CREATE + ROUTE piece.
