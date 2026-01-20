# ElevenLabs Knowledge Base Auto-Sync via n8n

## INSTRUCTIONS FOR NEW AGENT SESSION

This document contains a complete implementation plan. Please read it thoroughly and help me implement the n8n workflow described below. The goal is to automatically sync knowledge base documents from my team-checking-system to ElevenLabs when documents are approved.

**What I need you to do:**
1. Create the project folder at `root/n8n-elevenlabs-auto-update/`
2. Help me build the n8n workflow using the n8n MCP server (or provide node configurations I can copy)
3. Test the integration with a sample document

**Key resources:**
- n8n MCP server: https://github.com/czlonkowski/n8n-mcp
- n8n instance: https://n8n.srv1255158.hstgr.cloud
- Existing workflow to modify: https://n8n.srv1255158.hstgr.cloud/workflow/74KRa8KF7dY3Z-OXdBMpp

---

## FULL CONTEXT & BACKGROUND

### What I Have (Current System)

1. **team-checking-system** - A Next.js app that manages knowledge base markdown files
   - Files stored in GitHub repo: `ZenCleanz-Brain/ZC-Brain-Knowledge-Base`
   - Editors submit changes → Stored as pending edits in Supabase → Admins approve → Commits to GitHub
   - **When approved, triggers n8n webhook** at `https://n8n.srv1255158.hstgr.cloud/webhook/kb-update`

2. **ElevenLabs Conversational AI Agent** - "ZenCleanz Brain 1.0.1"
   - Agent ID: `agent_4101kebd8snsff0az1775xyzhamc`
   - Has **workflow with sub-agent nodes**, each with their own knowledge base documents
   - Documents are already uploaded to ElevenLabs KB and attached to sub-agents

3. **n8n instance** - Self-hosted at `https://n8n.srv1255158.hstgr.cloud`
   - Already has webhook receiving document updates from team-checking-system
   - Already has ElevenLabs credentials configured (Header Auth with `xi-api-key`)

### What I Need (The Problem)

When I edit a markdown document in team-checking-system and approve it:
- ✅ It currently commits to GitHub (working)
- ✅ It currently triggers n8n webhook (working)
- ❌ It does NOT update the corresponding document in ElevenLabs KB (NEED TO BUILD)

### The Solution

Build an n8n workflow that:
1. Receives the webhook with document content
2. Finds which ElevenLabs sub-agent has that document (by exact name match)
3. Deletes the old document from ElevenLabs KB
4. Uploads the new document to ElevenLabs KB
5. Updates the agent config with the new document ID

**Critical ElevenLabs constraint:** You CANNOT update document content directly - you must DELETE the old doc and upload a new one. The document ID changes after re-upload.

---

## CREDENTIALS & IDs REFERENCE

### n8n Instance
- **Base URL:** `https://n8n.srv1255158.hstgr.cloud`
- **API Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjY2Q1MmEwNy01NjYxLTRlNjYtYjk0MC1lNzdiOGUxY2E4MjQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY4ODk1MDc5fQ.dAfwxaKRE-0tYPukZGlo4Wp_XQm8yRvORYJYTxGtN3o`
- **Webhook URL:** `https://n8n.srv1255158.hstgr.cloud/webhook/kb-update`

### ElevenLabs
- **API Base URL:** `https://api.elevenlabs.io`
- **Auth Header:** `xi-api-key: <key already configured in n8n as "elevenlabs" credential>`
- **Main Agent ID:** `agent_4101kebd8snsff0az1775xyzhamc`

### ElevenLabs Sub-Agent Node IDs
| Node ID | Label | Has Knowledge Base |
|---------|-------|--------------------|
| `node_01kebdaxdqe03bzdtb99872b15` | Main Routing Agent | No |
| `node_01kebdc3pte03bzdtvh5ckg3ae` | Product Agent + TCM 5 Elements | Yes |
| `node_01kebdshtre03bzdwdfw7m5amr` | General FAQs | Yes |
| `node_01kedgddtpe8jbf4xd2mkqmz1j` | General Wellness (Blogs) | Yes |

### GitHub (for reference)
- **Repo:** `ZenCleanz-Brain/ZC-Brain-Knowledge-Base`
- **Branch:** `master`
- **KB Path:** `PUBLISHED FOLDERS MASTER/`

---

## Executive Summary

**Goal:** When a knowledge base document is approved/reverted in team-checking-system, automatically sync it to the correct ElevenLabs sub-agent's knowledge base.

**Approach:**
1. Leverage existing webhook trigger (already working)
2. Use **exact document name matching** to find which sub-agent(s) have the document
3. Delete old document → Upload new document → Update agent config
4. Handle both `update` and `revert` actions

**Key Files to Modify:**
- n8n workflow: `https://n8n.srv1255158.hstgr.cloud/workflow/74KRa8KF7dY3Z-OXdBMpp`
- Credentials: ElevenLabs API key in n8n

**Project Location:** All build files and configurations will be stored in:

```
root/n8n-elevenlabs-auto-update/
```

**Implementation Method:** n8n MCP server to build workflow nodes directly

---

## Webhook Payload (What n8n Receives)

When a document is approved in team-checking-system, the webhook sends:

```json
{
  "action": "update",
  "files": [
    {
      "path": "PUBLISHED FOLDERS MASTER/Products/AMBROSIA_(MIBROBIOME_SUPPORT).md",
      "name": "AMBROSIA_(MIBROBIOME_SUPPORT).md"
    }
  ],
  "content": "# Full markdown content of the file...",
  "approvedBy": "admin",
  "approvedAt": "2026-01-20T10:30:00Z"
}
```

For reverts, action is `"revert"` and content contains the original (pre-edit) content.

---

## Overview

Build an n8n workflow that automatically syncs knowledge base documents from GitHub (via existing webhook) to ElevenLabs agent knowledge bases, handling the proper sub-agent routing and document update logic.

---

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

---

## Current State

### What Already Works

- GitHub file management via Octokit
- Pending edit workflow with Supabase
- n8n webhook triggered on approval: `https://n8n.srv1255158.hstgr.cloud/webhook/kb-update`
- Webhook payload includes: `{ action, files: [{path, name}], content, approvedBy, approvedAt }`

### What Needs to be Built

- n8n workflow to process the webhook and sync to ElevenLabs
- Document routing logic (exact name matching against agent config)
- ElevenLabs API integration (delete old doc → upload new → update agent)

---

## ElevenLabs API Endpoints Required

| Action | Endpoint | Method | Purpose |
|--------|----------|--------|---------|
| Get Agent | `/v1/convai/agents/{agent_id}` | GET | Fetch current config + KB arrays |
| List KB Docs | `/v1/convai/knowledge-base` | GET | Search for existing document by name |
| Delete Doc | `/v1/convai/knowledge-base/{doc_id}?force=true` | DELETE | Remove old document |
| Upload Doc | `/v1/convai/knowledge-base/file` | POST | Upload new document (multipart) |
| Update Agent | `/v1/convai/agents/{agent_id}` | PATCH | Update workflow node KB arrays |

**Base URL:** `https://api.elevenlabs.io`
**Auth Header:** `xi-api-key: <your_api_key>`

---

## Agent Structure (From Your Data)

**Main Agent:** `agent_4101kebd8snsff0az1775xyzhamc` ("ZenCleanz Brain 1.0.1")

### Workflow Nodes (Sub-Agents)

| Node ID | Label | Has KB | Document Types |
|---------|-------|--------|----------------|
| `node_01kebdaxdqe03bzdtb99872b15` | Main Routing Agent | No | - |
| `node_01kebdc3pte03bzdtvh5ckg3ae` | Product Agent + TCM 5 Elements | Yes | Product docs, protocols, TCM elements |
| `node_01kebdshtre03bzdwdfw7m5amr` | General FAQs | Yes | FAQ docs, nutrition facts, sequencing |
| `node_01kedgddtpe8jbf4xd2mkqmz1j` | General Wellness (Blogs) | Yes | Blog articles, wellness content |

---

## n8n Workflow Design

### Node 1: Webhook Trigger

- **Type:** Webhook
- **Path:** `/webhook/kb-update` (already exists)
- **Method:** POST
- **Output:** `{ action, files, content, approvedBy, approvedAt }`

### Node 2: Filter Action

- **Type:** IF
- **Condition:** `action === 'update' || action === 'revert'`

### Node 3: Get Current Agent Config

- **Type:** HTTP Request
- **Method:** GET
- **URL:** `https://api.elevenlabs.io/v1/convai/agents/agent_4101kebd8snsff0az1775xyzhamc`
- **Headers:** `xi-api-key: {{$credentials.elevenLabsApiKey}}`

### Node 4: Find Document in Agent Config (Exact Match)

**Type:** Code
**Purpose:** Search ALL workflow nodes to find which sub-agent(s) contain this exact document name

```javascript
// Get agent config and webhook data
const agentConfig = $node["Get Agent Config"].json;
const fileName = $json.files[0].name;
const content = $json.content;
const action = $json.action;

// Search through all workflow nodes for this exact document name
const workflowNodes = agentConfig.workflow.nodes;
const matchingNodes = [];

for (const [nodeId, nodeConfig] of Object.entries(workflowNodes)) {
  const kb = nodeConfig.additional_knowledge_base || [];
  const matchingDoc = kb.find(doc => doc.name === fileName);

  if (matchingDoc) {
    matchingNodes.push({
      nodeId,
      nodeLabel: nodeConfig.label,
      existingDocId: matchingDoc.id,
      existingDocName: matchingDoc.name
    });
  }
}

// If document not found in any node, log and exit (new document scenario)
if (matchingNodes.length === 0) {
  console.log(`Document "${fileName}" not found in any sub-agent KB`);
  return { skip: true, reason: 'Document not found in any sub-agent' };
}

return {
  fileName,
  content,
  action,
  matchingNodes,  // Array of nodes that have this document
  agentConfig     // Full config for later PATCH
};
```

**Key Insight:** This approach uses **exact name matching** against the existing ElevenLabs KB. The document must already exist in at least one sub-agent's KB for automatic updates. For brand new documents, you'd manually add them to ElevenLabs first, then the system handles all future updates automatically.

### Node 5: Loop Over Matching Nodes (If Multiple)

- **Type:** Split In Batches / Loop
- **Purpose:** Handle documents that exist in multiple sub-agents

### Node 6: Delete Existing Document

- **Type:** HTTP Request
- **Method:** DELETE
- **URL:** `https://api.elevenlabs.io/v1/convai/knowledge-base/{{$json.matchingNodes[0].existingDocId}}?force=true`
- **Headers:** `xi-api-key`

### Node 7: Convert Content to Binary File

```javascript
// In a Code node before HTTP Request (Upload)
const content = $json.content;
const fileName = $json.files[0].name;

// Create binary data from text content
const binaryData = Buffer.from(content, 'utf-8');

return {
  binary: {
    file: {
      data: binaryData.toString('base64'),
      mimeType: 'text/markdown',
      fileName: fileName
    }
  }
};
```

### Node 8: Upload New Document

- **Type:** HTTP Request
- **Method:** POST
- **URL:** `https://api.elevenlabs.io/v1/convai/knowledge-base/file`
- **Body Type:** Multipart Form Data
- **Fields:**
  - `file`: Binary content from previous node
  - `name`: Document name (from fileName)
- **Headers:** `xi-api-key`
- **Response:** `{ id, name, folder_path }`

### Node 9: Build Updated Knowledge Base Array

- **Type:** Code
- **Purpose:** Construct the updated `additional_knowledge_base` array for the target node

```javascript
const agentConfig = $node["Find Document"].json.agentConfig;
const matchingNode = $node["Find Document"].json.matchingNodes[0];
const targetNodeId = matchingNode.nodeId;
const newDocId = $node["Upload Document"].json.id;
const newDocName = $node["Upload Document"].json.name;
const existingDocId = matchingNode.existingDocId;

// Get current node's KB array
const workflowNodes = agentConfig.workflow.nodes;
const targetNode = workflowNodes[targetNodeId];
let kbArray = [...(targetNode.additional_knowledge_base || [])];

// Remove old document
kbArray = kbArray.filter(doc => doc.id !== existingDocId);

// Add new document
kbArray.push({
  type: 'file',
  name: newDocName,
  id: newDocId,
  usage_mode: 'auto'
});

// Build PATCH payload - only the workflow nodes section
return {
  workflow: {
    nodes: {
      [targetNodeId]: {
        ...targetNode,
        additional_knowledge_base: kbArray
      }
    }
  }
};
```

### Node 10: Update Agent Configuration

- **Type:** HTTP Request
- **Method:** PATCH
- **URL:** `https://api.elevenlabs.io/v1/convai/agents/agent_4101kebd8snsff0az1775xyzhamc`
- **Headers:** `xi-api-key`, `Content-Type: application/json`
- **Body:** Output from Node 9

### Node 11: Success Response

- **Type:** Respond to Webhook
- **Body:** `{ success: true, documentId: newDocId, targetNode: targetNodeId }`

---

## Implementation Steps

### Step 1: Configure ElevenLabs Credentials in n8n

1. Create new credential in n8n for "Header Auth"
2. Name: `elevenlabs`
3. Header Name: `xi-api-key`
4. Header Value: Your ElevenLabs API key

### Step 2: Modify Existing Webhook Workflow

1. Open workflow: `https://n8n.srv1255158.hstgr.cloud/workflow/74KRa8KF7dY3Z-OXdBMpp`
2. Add the nodes described above after the webhook trigger

### Step 3: Test with a Single Document

1. Make a small edit to a test document in team-checking-system
2. Approve the edit
3. Monitor n8n execution logs
4. Verify document appears in ElevenLabs KB

### Step 4: Add Error Handling

- Add Error Trigger node to catch failures
- Optionally notify via webhook on errors

---

## Critical Constraints (From ElevenLabs API)

1. **No direct content update** - Must DELETE old doc, then upload new
2. **Full array replacement** - When updating agent KB, send complete array
3. **Document IDs change** - After delete + re-upload, document gets new ID
4. **Force delete required** - Use `?force=true` to delete docs attached to agents
5. **Multipart upload** - File upload requires `multipart/form-data`

---

## Revert Handling (action="revert")

When an admin reverts an approved edit, the workflow should restore the previous document version:

### Revert Flow

1. **Webhook receives:** `{ action: 'revert', files, content (original content), revertedBy, originalEditBy }`
2. **Find document** in agent config by exact name match (same as update)
3. **Delete current document** from ElevenLabs KB
4. **Upload original content** as new document
5. **Update agent config** with new document ID

The revert flow is nearly identical to update - the only difference is:
- `content` field contains the ORIGINAL content (pre-edit)
- Metadata includes `revertedBy` instead of `approvedBy`

### Code for Revert Branch

```javascript
// In the action check node, handle both 'update' and 'revert'
const action = $json.action;

if (action === 'update' || action === 'revert') {
  // Proceed with delete → upload → update flow
  // The 'content' field already contains the correct version:
  // - For 'update': new/edited content
  // - For 'revert': original content before the edit
  return { proceed: true, action };
}

return { proceed: false, reason: `Unhandled action: ${action}` };
```

---

## Environment Variables Needed

Add to `.env` or n8n credentials:

```
ELEVENLABS_API_KEY=sk_xxxxx (your actual key)
ELEVENLABS_AGENT_ID=agent_4101kebd8snsff0az1775xyzhamc
```

---

## n8n MCP Integration Plan

Since you want to use n8n MCP to build the workflow directly:

### Step 1: Configure n8n MCP Server

The n8n MCP server needs your n8n API credentials:

```
N8N_API_URL=https://n8n.srv1255158.hstgr.cloud
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Workflow to Modify

Target workflow: `https://n8n.srv1255158.hstgr.cloud/workflow/74KRa8KF7dY3Z-OXdBMpp`

### Step 3: Nodes to Add (via MCP)

Using the n8n MCP, I will help you add these nodes to your existing workflow:

1. **HTTP Request** - Get Agent Config from ElevenLabs
2. **Code** - Find document in agent config by exact name
3. **IF** - Check if document found
4. **HTTP Request** - Delete existing document (if found)
5. **Code** - Convert content to binary file
6. **HTTP Request** - Upload new document
7. **Code** - Build updated KB array
8. **HTTP Request** - PATCH agent config
9. **Respond to Webhook** - Return success/failure

---

## Verification Checklist

### Pre-Implementation Checks

- [ ] ElevenLabs API key is available and working
- [ ] n8n can reach ElevenLabs API (no firewall issues)
- [ ] Document names in team-checking-system EXACTLY match ElevenLabs KB names

### Post-Implementation Testing

1. **Test API Connectivity:**
   - Manually call `GET /v1/convai/agents/{agent_id}` from n8n
   - Verify agent config is returned with all workflow nodes

2. **Test Document Search:**
   - Pick an existing document name (e.g., "AMBROSIA_(MIBROBIOME_SUPPORT).md")
   - Verify it's found in the correct sub-agent's KB array

3. **Test Update Flow:**
   - Make a small edit to a test document in team-checking-system
   - Approve the edit
   - Verify in n8n execution log:
     - Document found in agent config ✓
     - Old document deleted ✓
     - New document uploaded ✓
     - Agent config updated ✓
   - Check ElevenLabs dashboard to confirm document is updated

4. **Test Revert Flow:**
   - Revert the approved edit
   - Verify original content is restored in ElevenLabs KB

5. **Test Chat:**
   - Ask the ElevenLabs agent a question that uses the updated document
   - Verify it responds with the new content

---

## Optional Enhancements (Future)

1. **Batch Updates:** Handle multiple files in single webhook
2. **Delete Handling:** When action="delete", remove document from ElevenLabs entirely
3. **Logging:** Store sync history in Supabase for audit trail
4. **Retry Logic:** Add retry nodes for failed API calls
5. **Notification:** Send Slack/email on sync success/failure
6. **New Document Handling:** Add UI option to specify target sub-agent for brand new documents

---

## Project Folder Structure

All project files will be created in `root/n8n-elevenlabs-auto-update/`:

```
n8n-elevenlabs-auto-update/
├── README.md                    # Project documentation
├── .env.example                 # Environment variables template
├── config/
│   └── agent-mapping.json       # Agent ID and node mappings
├── workflows/
│   └── elevenlabs-kb-sync.json  # Exported n8n workflow (backup)
├── scripts/
│   └── test-api.js              # API connectivity test script
└── docs/
    └── api-reference.md         # ElevenLabs API quick reference
```

---

## Quick Start (After Plan Approval)

1. I'll create the `n8n-elevenlabs-auto-update` folder structure
2. I'll help you configure the n8n MCP connection
3. We'll add your ElevenLabs API key to n8n credentials
4. I'll guide you through adding each node to the workflow
5. We'll test with a single document before going live

---

## ELEVENLABS API DETAILED REFERENCE

### 1. Get Agent Configuration

**Purpose:** Fetch the current agent config including all workflow nodes and their knowledge bases

```
GET https://api.elevenlabs.io/v1/convai/agents/{agent_id}
Headers: xi-api-key: <your_key>
```

**Response Structure (relevant parts):**
```json
{
  "agent_id": "agent_4101kebd8snsff0az1775xyzhamc",
  "name": "ZenCleanz Brain 1.0.1",
  "workflow": {
    "nodes": {
      "node_01kebdc3pte03bzdtvh5ckg3ae": {
        "label": "Product Agent + TCM 5 Elements",
        "type": "override_agent",
        "additional_knowledge_base": [
          {
            "type": "file",
            "name": "AMBROSIA_(MIBROBIOME_SUPPORT).md",
            "id": "abkt28Wjc6LGea9WoVRn",
            "usage_mode": "auto"
          }
        ]
      }
    }
  }
}
```

### 2. Delete Knowledge Base Document

**Purpose:** Remove a document from the knowledge base (required before re-uploading updated content)

```
DELETE https://api.elevenlabs.io/v1/convai/knowledge-base/{documentation_id}?force=true
Headers: xi-api-key: <your_key>
```

**Parameters:**
- `documentation_id` (path): The document ID from the KB (e.g., "abkt28Wjc6LGea9WoVRn")
- `force=true` (query): Required to delete documents attached to agents

**Response:** `200 OK` on success

### 3. Upload New Document

**Purpose:** Upload a new document to the knowledge base

```
POST https://api.elevenlabs.io/v1/convai/knowledge-base/file
Headers:
  xi-api-key: <your_key>
  Content-Type: multipart/form-data
Body:
  file: <binary file data>
  name: "AMBROSIA_(MIBROBIOME_SUPPORT).md" (optional, uses filename if not provided)
```

**Response:**
```json
{
  "id": "newDocumentId123",
  "name": "AMBROSIA_(MIBROBIOME_SUPPORT).md",
  "folder_path": []
}
```

### 4. Update Agent Configuration

**Purpose:** Update the agent's workflow nodes with the new document ID

```
PATCH https://api.elevenlabs.io/v1/convai/agents/{agent_id}
Headers:
  xi-api-key: <your_key>
  Content-Type: application/json
Body: (only include what you're changing)
```

**Body for updating a workflow node's knowledge base:**
```json
{
  "workflow": {
    "nodes": {
      "node_01kebdc3pte03bzdtvh5ckg3ae": {
        "additional_knowledge_base": [
          {
            "type": "file",
            "name": "AMBROSIA_(MIBROBIOME_SUPPORT).md",
            "id": "newDocumentId123",
            "usage_mode": "auto"
          },
          // ... other existing documents in this node
        ]
      }
    }
  }
}
```

**Important:** You must send the COMPLETE `additional_knowledge_base` array for the node - not just the new document.

---

## SAMPLE N8N NODE CONFIGURATIONS

Below are the n8n node configurations you can use. Copy these into your n8n workflow.

### Node: Get Agent Config (HTTP Request)

```json
{
  "parameters": {
    "method": "GET",
    "url": "https://api.elevenlabs.io/v1/convai/agents/agent_4101kebd8snsff0az1775xyzhamc",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "options": {}
  },
  "name": "Get Agent Config",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [620, 300],
  "credentials": {
    "httpHeaderAuth": {
      "id": "YOUR_ELEVENLABS_CREDENTIAL_ID",
      "name": "elevenlabs"
    }
  }
}
```

### Node: Find Document in Agent (Code)

```json
{
  "parameters": {
    "jsCode": "// Get data from previous nodes\nconst agentConfig = $('Get Agent Config').first().json;\nconst webhookData = $('Webhook').first().json;\n\nconst fileName = webhookData.files[0].name;\nconst content = webhookData.content;\nconst action = webhookData.action;\n\n// Search through all workflow nodes for this exact document name\nconst workflowNodes = agentConfig.workflow?.nodes || {};\nconst matchingNodes = [];\n\nfor (const [nodeId, nodeConfig] of Object.entries(workflowNodes)) {\n  const kb = nodeConfig.additional_knowledge_base || [];\n  const matchingDoc = kb.find(doc => doc.name === fileName);\n\n  if (matchingDoc) {\n    matchingNodes.push({\n      nodeId,\n      nodeLabel: nodeConfig.label,\n      existingDocId: matchingDoc.id,\n      existingDocName: matchingDoc.name,\n      fullKbArray: kb\n    });\n  }\n}\n\n// If document not found, return skip flag\nif (matchingNodes.length === 0) {\n  return [{\n    json: {\n      skip: true,\n      reason: `Document \"${fileName}\" not found in any sub-agent KB`,\n      fileName\n    }\n  }];\n}\n\nreturn [{\n  json: {\n    skip: false,\n    fileName,\n    content,\n    action,\n    matchingNodes,\n    agentConfig\n  }\n}];"
  },
  "name": "Find Document in Agent",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [840, 300]
}
```

### Node: Check If Found (IF)

```json
{
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict"
      },
      "conditions": [
        {
          "id": "condition-1",
          "leftValue": "={{ $json.skip }}",
          "rightValue": false,
          "operator": {
            "type": "boolean",
            "operation": "equals"
          }
        }
      ],
      "combinator": "and"
    },
    "options": {}
  },
  "name": "Check If Found",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2,
  "position": [1060, 300]
}
```

### Node: Delete Existing Document (HTTP Request)

```json
{
  "parameters": {
    "method": "DELETE",
    "url": "=https://api.elevenlabs.io/v1/convai/knowledge-base/{{ $json.matchingNodes[0].existingDocId }}?force=true",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "options": {}
  },
  "name": "Delete Existing Document",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [1280, 200],
  "credentials": {
    "httpHeaderAuth": {
      "id": "YOUR_ELEVENLABS_CREDENTIAL_ID",
      "name": "elevenlabs"
    }
  }
}
```

### Node: Convert Content to Binary (Code)

```json
{
  "parameters": {
    "jsCode": "// Get data from Find Document node\nconst data = $('Find Document in Agent').first().json;\nconst content = data.content;\nconst fileName = data.fileName;\n\n// Create binary data from text content\nconst binaryData = Buffer.from(content, 'utf-8');\n\nreturn [{\n  json: {\n    fileName: fileName,\n    matchingNodes: data.matchingNodes,\n    agentConfig: data.agentConfig\n  },\n  binary: {\n    file: {\n      data: binaryData.toString('base64'),\n      mimeType: 'text/markdown',\n      fileName: fileName\n    }\n  }\n}];"
  },
  "name": "Convert Content to Binary",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [1500, 200]
}
```

### Node: Upload New Document (HTTP Request)

```json
{
  "parameters": {
    "method": "POST",
    "url": "https://api.elevenlabs.io/v1/convai/knowledge-base/file",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendBody": true,
    "contentType": "multipart-form-data",
    "bodyParameters": {
      "parameters": [
        {
          "parameterType": "formBinaryData",
          "name": "file",
          "inputDataFieldName": "file"
        },
        {
          "parameterType": "formData",
          "name": "name",
          "value": "={{ $json.fileName }}"
        }
      ]
    },
    "options": {}
  },
  "name": "Upload New Document",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [1720, 200],
  "credentials": {
    "httpHeaderAuth": {
      "id": "YOUR_ELEVENLABS_CREDENTIAL_ID",
      "name": "elevenlabs"
    }
  }
}
```

### Node: Build Updated KB Array (Code)

```json
{
  "parameters": {
    "jsCode": "// Get data from previous nodes\nconst findData = $('Find Document in Agent').first().json;\nconst uploadResponse = $('Upload New Document').first().json;\n\nconst agentConfig = findData.agentConfig;\nconst matchingNode = findData.matchingNodes[0];\nconst targetNodeId = matchingNode.nodeId;\nconst newDocId = uploadResponse.id;\nconst newDocName = uploadResponse.name;\nconst existingDocId = matchingNode.existingDocId;\n\n// Get current node's full config\nconst workflowNodes = agentConfig.workflow.nodes;\nconst targetNode = workflowNodes[targetNodeId];\nlet kbArray = [...(targetNode.additional_knowledge_base || [])];\n\n// Remove old document\nkbArray = kbArray.filter(doc => doc.id !== existingDocId);\n\n// Add new document\nkbArray.push({\n  type: 'file',\n  name: newDocName,\n  id: newDocId,\n  usage_mode: 'auto'\n});\n\n// Build PATCH payload\nconst patchPayload = {\n  workflow: {\n    nodes: {\n      [targetNodeId]: {\n        ...targetNode,\n        additional_knowledge_base: kbArray\n      }\n    }\n  }\n};\n\nreturn [{\n  json: {\n    patchPayload,\n    newDocId,\n    targetNodeId,\n    targetNodeLabel: matchingNode.nodeLabel\n  }\n}];"
  },
  "name": "Build Updated KB Array",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [1940, 200]
}
```

### Node: Update Agent Config (HTTP Request)

```json
{
  "parameters": {
    "method": "PATCH",
    "url": "https://api.elevenlabs.io/v1/convai/agents/agent_4101kebd8snsff0az1775xyzhamc",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify($json.patchPayload) }}",
    "options": {}
  },
  "name": "Update Agent Config",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [2160, 200],
  "credentials": {
    "httpHeaderAuth": {
      "id": "YOUR_ELEVENLABS_CREDENTIAL_ID",
      "name": "elevenlabs"
    }
  }
}
```

### Node: Success Response (Respond to Webhook)

```json
{
  "parameters": {
    "respondWith": "json",
    "responseBody": "={\n  \"success\": true,\n  \"message\": \"Document synced to ElevenLabs\",\n  \"newDocumentId\": \"{{ $json.newDocId }}\",\n  \"targetNode\": \"{{ $json.targetNodeLabel }}\"\n}",
    "options": {}
  },
  "name": "Success Response",
  "type": "n8n-nodes-base.respondToWebhook",
  "typeVersion": 1.1,
  "position": [2380, 200]
}
```

---

## SAMPLE CURL COMMANDS FOR TESTING

### Test 1: Get Agent Config
```bash
curl -X GET "https://api.elevenlabs.io/v1/convai/agents/agent_4101kebd8snsff0az1775xyzhamc" \
  -H "xi-api-key: YOUR_API_KEY"
```

### Test 2: List Knowledge Base Documents
```bash
curl -X GET "https://api.elevenlabs.io/v1/convai/knowledge-base?search=AMBROSIA" \
  -H "xi-api-key: YOUR_API_KEY"
```

### Test 3: Delete a Document
```bash
curl -X DELETE "https://api.elevenlabs.io/v1/convai/knowledge-base/DOCUMENT_ID?force=true" \
  -H "xi-api-key: YOUR_API_KEY"
```

### Test 4: Upload a Document
```bash
curl -X POST "https://api.elevenlabs.io/v1/convai/knowledge-base/file" \
  -H "xi-api-key: YOUR_API_KEY" \
  -F "file=@/path/to/document.md" \
  -F "name=document.md"
```

---

## WORKFLOW DIAGRAM (Visual Flow)

```
┌──────────────┐    ┌─────────────────┐    ┌────────────────────┐
│   Webhook    │───▶│ Get Agent Config│───▶│ Find Document in   │
│   Trigger    │    │   (HTTP GET)    │    │ Agent (Code)       │
└──────────────┘    └─────────────────┘    └─────────┬──────────┘
                                                      │
                                           ┌──────────▼──────────┐
                                           │  Check If Found (IF)│
                                           └──────────┬──────────┘
                                                      │
                         Found ───────────────────────┼─────────────────── Not Found
                              │                                                  │
                    ┌─────────▼─────────┐                          ┌─────────────▼──────────┐
                    │ Delete Existing   │                          │ Log & Skip Response    │
                    │ Document (DELETE) │                          └────────────────────────┘
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Convert Content   │
                    │ to Binary (Code)  │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Upload New Doc    │
                    │ (HTTP POST)       │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Build Updated     │
                    │ KB Array (Code)   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Update Agent      │
                    │ Config (PATCH)    │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Success Response  │
                    └───────────────────┘
```
