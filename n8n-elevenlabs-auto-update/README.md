# ElevenLabs Knowledge Base Auto-Sync via n8n

Automatically sync knowledge base documents from the team-checking-system to ElevenLabs when documents are approved.

## Overview

When a document is approved in the team-checking-system:
1. ✅ It commits to GitHub (already working)
2. ✅ It triggers n8n webhook (already working)
3. ✅ It updates the corresponding document in ElevenLabs KB (**this workflow**)

## Architecture

```
┌─────────────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│ team-checking-system│────▶│   n8n Workflow  │────▶│   ElevenLabs API     │
│ (GitHub + Supabase) │     │  (Orchestrator) │     │  (KB + Agent Update) │
└─────────────────────┘     └─────────────────┘     └──────────────────────┘
         │                          │                         │
    Edit Approved           Process & Route            Update KB Docs
    Triggers Webhook        to Sub-Agents              Update Agent Config
```

## Quick Start

### 1. Configure ElevenLabs Credentials in n8n

1. Go to n8n → Settings → Credentials
2. Create new "Header Auth" credential
3. Name: `elevenlabs`
4. Header Name: `xi-api-key`
5. Header Value: Your ElevenLabs API key

### 2. Import the Workflow

1. Open n8n at `https://n8n.srv1255158.hstgr.cloud`
2. Go to your existing workflow: `/workflow/74KRa8KF7dY3Z-OXdBMpp`
3. Import `workflows/elevenlabs-kb-sync.json` or add nodes manually

### 3. Update Credential References

After importing, update each HTTP Request node's credential reference to point to your `elevenlabs` credential.

### 4. Test the Integration

```bash
# Test API connectivity first
node scripts/test-api.js
```

Then make a small edit in team-checking-system and approve it.

## Workflow Flow

```
Webhook Trigger
     │
     ▼
Get Agent Config (HTTP GET)
     │
     ▼
Find Document in Agent (Code) ─── Search all workflow nodes by exact filename match
     │
     ▼
Check If Found (IF)
     │
     ├── Found ─────────────────────┐
     │                              │
     │                    Delete Existing Document (DELETE)
     │                              │
     │                    Convert Content to Binary (Code)
     │                              │
     │                    Upload New Document (POST)
     │                              │
     │                    Build Updated KB Array (Code)
     │                              │
     │                    Update Agent Config (PATCH)
     │                              │
     │                    Success Response
     │
     └── Not Found ─────────────────┘
                                    │
                          Log & Skip Response
```

## Key Constraints

1. **No direct content update** - Must DELETE old doc, then upload new
2. **Full array replacement** - When updating agent KB, send complete array
3. **Document IDs change** - After delete + re-upload, document gets new ID
4. **Force delete required** - Use `?force=true` to delete docs attached to agents
5. **Multipart upload** - File upload requires `multipart/form-data`

## Files

```
n8n-elevenlabs-auto-update/
├── README.md                    # This file
├── .env.example                 # Environment variables template
├── config/
│   └── agent-mapping.json       # Agent ID and node mappings
├── workflows/
│   └── elevenlabs-kb-sync.json  # Complete n8n workflow for import
├── scripts/
│   └── test-api.js              # API connectivity test script
└── docs/
    └── api-reference.md         # ElevenLabs API quick reference
```

## Webhook Payload

When a document is approved:
```json
{
  "action": "update",
  "files": [{ "path": "...", "name": "DOCUMENT.md" }],
  "content": "# Full markdown content...",
  "approvedBy": "admin",
  "approvedAt": "2026-01-20T10:30:00Z"
}
```

For reverts: `action: "revert"` with original content.

## Troubleshooting

### Document not found
- Check that the filename in team-checking-system EXACTLY matches the filename in ElevenLabs KB
- Document must already exist in ElevenLabs (this workflow updates, doesn't create new)

### API errors
- Verify ElevenLabs API key is correct
- Check n8n execution logs for detailed error messages
- Use `scripts/test-api.js` to verify connectivity

### Agent config not updating
- Ensure you're sending the COMPLETE `additional_knowledge_base` array
- Check that the node ID is correct
