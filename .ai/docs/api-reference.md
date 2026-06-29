# API Reference

Base path: `server/api/forms/`

## Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/forms` | List all forms |
| POST | `/api/forms` | Create form |
| GET | `/api/forms/[id]` | Get form with elements (filters soft-deleted) |
| PATCH | `/api/forms/[id]` | Update form metadata |
| DELETE | `/api/forms/[id]` | Delete form (cascade deletes elements) |
| PUT | `/api/forms/[id]/elements` | Bulk element operation |

## Bulk Elements Endpoint

`PUT /api/forms/[id]/elements` handles:

- Create new elements
- Update existing elements
- Soft-delete removed elements
- Map tempIds to real database IDs
- Resolve parent references (tempIds in parentId → real IDs)

**Response includes:**

```json
{
  "tempIdMap": {
    "temp-123": 45,
    "temp-456": 46
  }
}
```

## File Naming Convention

```
server/api/forms/
├── index.get.ts           # GET /api/forms
├── index.post.ts          # POST /api/forms
├── [id].get.ts            # GET /api/forms/:id
├── [id].patch.ts          # PATCH /api/forms/:id
├── [id].delete.ts         # DELETE /api/forms/:id
└── [id]/
    └── elements.put.ts    # PUT /api/forms/:id/elements
```
