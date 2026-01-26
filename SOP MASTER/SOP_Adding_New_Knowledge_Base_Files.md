# SOP: Adding New Knowledge Base Files

## Quick Steps for NEW Files

### 1. Create File Locally
- Save as `FILENAME.md` in `PUBLISHED FOLDERS MASTER/[folder]/`

### 2. Push to GitHub
- Via direct push

### 3. Upload to ElevenLabs (Required for NEW files)
- Go to: ElevenLabs Dashboard → Agent → Knowledge Base
- Upload your `.md` file
- **Filename must EXACTLY match** your GitHub filename

### 4. Assign to Correct Node
| Content Type | Assign To |
|--------------|-----------|
| Products, Protocols, TCM | Product Agent |
| FAQs, Nutrition Facts | FAQ Agent |
| Blogs, Wellness Articles | Wellness Agent |

### 5. Done!
Future edits via Team Portal will auto-sync.

---

## Key Rules

- **NEW files** = Manual upload to ElevenLabs required (one-time)
- **EXISTING files** = Auto-sync via n8n (no action needed)
- **Filename matching** = Must be exact (case-sensitive)

---

## Why This Works

```
NEW FILE:     Local → GitHub → Manual 11Labs Upload → Done
UPDATES:      Team Portal Edit → GitHub → Auto n8n Sync → 11Labs
```
