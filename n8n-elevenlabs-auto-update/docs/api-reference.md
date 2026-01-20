# ElevenLabs Conversational AI API Reference

Quick reference for the API endpoints used in the KB auto-sync workflow.

## Authentication

All requests require the `xi-api-key` header:

```
xi-api-key: sk_xxxxxxxxxxxxxxxxxxxxx
```

## Base URL

```
https://api.elevenlabs.io
```

---

## Endpoints

### 1. Get Agent Configuration

Retrieve the full agent configuration including all workflow nodes and their knowledge bases.

**Request:**
```http
GET /v1/convai/agents/{agent_id}
```

**Response (relevant parts):**
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

**Use Case:** Fetch current config to find which sub-agent has a specific document.

---

### 2. Delete Knowledge Base Document

Remove a document from the knowledge base. Required before re-uploading updated content.

**Request:**
```http
DELETE /v1/convai/knowledge-base/{document_id}?force=true
```

**Parameters:**
| Name | Location | Required | Description |
|------|----------|----------|-------------|
| `document_id` | path | Yes | The document ID (e.g., "abkt28Wjc6LGea9WoVRn") |
| `force` | query | Yes* | Required when document is attached to an agent |

**Response:**
```
200 OK
```

**Important:** Without `force=true`, you cannot delete documents that are attached to agents.

---

### 3. Upload New Document

Upload a new document to the knowledge base.

**Request:**
```http
POST /v1/convai/knowledge-base/file
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | binary | Yes | The file content |
| `name` | string | No | Display name (defaults to filename) |

**Response:**
```json
{
  "id": "newDocumentId123",
  "name": "AMBROSIA_(MIBROBIOME_SUPPORT).md",
  "folder_path": []
}
```

**Important:** The new document gets a NEW ID - different from the deleted one.

---

### 4. Update Agent Configuration

Update the agent's workflow nodes with new document references.

**Request:**
```http
PATCH /v1/convai/agents/{agent_id}
Content-Type: application/json
```

**Body Example:**
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
          // ... other existing documents
        ]
      }
    }
  }
}
```

**Important:**
- Send the COMPLETE `additional_knowledge_base` array for the node
- Other documents in the array should be preserved
- You can update multiple nodes in a single PATCH request

---

### 5. List Knowledge Base Documents (Optional)

Search for documents in the knowledge base.

**Request:**
```http
GET /v1/convai/knowledge-base?search={query}
```

**Parameters:**
| Name | Location | Required | Description |
|------|----------|----------|-------------|
| `search` | query | No | Search term to filter documents |

**Response:**
```json
{
  "documents": [
    {
      "id": "abkt28Wjc6LGea9WoVRn",
      "name": "AMBROSIA_(MIBROBIOME_SUPPORT).md",
      "created_at": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

## Complete Flow

```
1. GET /v1/convai/agents/{agent_id}
   → Find document by name in workflow.nodes[*].additional_knowledge_base

2. DELETE /v1/convai/knowledge-base/{old_doc_id}?force=true
   → Remove old document

3. POST /v1/convai/knowledge-base/file
   → Upload new document, get new ID

4. PATCH /v1/convai/agents/{agent_id}
   → Update node's additional_knowledge_base array with new doc ID
```

---

## Error Codes

| Status | Meaning | Common Cause |
|--------|---------|--------------|
| 401 | Unauthorized | Invalid or missing API key |
| 403 | Forbidden | API key doesn't have required permissions |
| 404 | Not Found | Agent ID or Document ID doesn't exist |
| 422 | Validation Error | Invalid request body format |
| 429 | Rate Limited | Too many requests |

---

## cURL Examples

### Get Agent Config
```bash
curl -X GET "https://api.elevenlabs.io/v1/convai/agents/agent_4101kebd8snsff0az1775xyzhamc" \
  -H "xi-api-key: YOUR_API_KEY"
```

### Delete Document
```bash
curl -X DELETE "https://api.elevenlabs.io/v1/convai/knowledge-base/DOCUMENT_ID?force=true" \
  -H "xi-api-key: YOUR_API_KEY"
```

### Upload Document
```bash
curl -X POST "https://api.elevenlabs.io/v1/convai/knowledge-base/file" \
  -H "xi-api-key: YOUR_API_KEY" \
  -F "file=@/path/to/document.md" \
  -F "name=document.md"
```

### Update Agent
```bash
curl -X PATCH "https://api.elevenlabs.io/v1/convai/agents/agent_4101kebd8snsff0az1775xyzhamc" \
  -H "xi-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"workflow":{"nodes":{"node_id":{"additional_knowledge_base":[...]}}}}'
```
