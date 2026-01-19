## Goal

Automatically sync documents (create/update) from Google Drive into an **ElevenLabs agent knowledge base** using **n8n + ElevenLabs API**.

---

## Step-by-Step Process

### 1. Source of Truth

* Store all knowledge documents in **Google Drive (single folder)**.
* This folder is the canonical content source.

---

### 2. Trigger (Change Detection)

* Use **Google Drive Trigger** in n8n.
* Condition:

  * Watch **specific folder**
  * Event: **File Updated** (covers both new + modified files)
* Schedule trigger (e.g., daily, hourly, every minute).

---

### 3. Capture Metadata

From trigger output, store:

* `document_name` (Google file name)
* `google_doc_id` (Google Drive file ID)
* `agent_id` (ElevenLabs agent ID – manually copied once)

---

### 4. Fetch Agent Configuration

* Send **GET** request to ElevenLabs:

  * Endpoint: `GET /v1/agents/{agent_id}`
* Authenticate using **ElevenLabs API Key**.
* Result includes:

  * Current **knowledge base documents array**
  * Each document has:

    * `name`
    * `document_id` (ElevenLabs KB ID)

---

### 5. Check If Document Exists

* Compare `document_name` against agent’s knowledge base array.
* If name matches:

  * `is_update = true`
  * Capture existing `elevenlabs_document_id`
* Else:

  * `is_update = false`

---

### 6. Handle Update Case (If Exists)

* If `is_update = true`:

  * **DELETE** existing document:

    * Endpoint: `DELETE /v1/knowledge-base/{document_id}`
  * Reason: ElevenLabs PATCH only updates name, not content.

---

### 7. Download Source File

* Use **Google Drive → Download File**
* Download by:

  * File ID = `google_doc_id`
* Output is a **binary file**.

---

### 8. Upload Document to ElevenLabs Knowledge Base

* Send **POST** request:

  * Endpoint: `POST /v1/knowledge-base`
* Request type: `multipart/form-data`
* Body:

  * `file` = binary file
  * `name` = document_name
* Response returns:

  * `new_document_id` (ElevenLabs KB ID)

---

### 9. Rebuild Agent Knowledge Base Array

* Take existing KB array from Step 4.
* Remove old document (if update).
* Append new document:

  * `{ name, new_document_id }`
* Result = **full updated KB array**.

---

### 10. Update Agent Configuration

* Send **PATCH** request:

  * Endpoint: `PATCH /v1/agents/{agent_id}`
* Body:

  * `conversation_config.agent_prompt.knowledge_base = updated_array`
* Entire array must be sent (no partial updates allowed).

---

### 11. Result

* Document is:

  * Stored in ElevenLabs Knowledge Base
  * Attached to the agent
  * Automatically refreshed on every file change

---

## Key Constraints (Important)

* ElevenLabs **cannot update document content directly** → must delete + re-add.
* Agent updates require **full KB array replacement**, not incremental push.
* Knowledge Base is **account-level**, agent attachment is separate.

---

## Outcome

* Scalable, automated KB updates.
* No manual uploads.
* Works with any CMS (Google Drive, DB, etc.).
