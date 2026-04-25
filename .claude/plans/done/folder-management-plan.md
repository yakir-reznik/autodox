# Folder Management for Forms

## Overview
Add folder/directory management to organize forms. Admin users can create folders, rename them, move forms between folders, and delete folders (with cascade delete of contained forms).

**Design Decisions:**
- One level only (no nested folders)
- Cascade delete: deleting a folder deletes all forms inside
- Sidebar navigation: folders in left sidebar, forms grid on right

---

## Implementation Steps

### 1. Database Schema Changes
**File:** `server/db/schema.ts`

- Add `foldersTable`:
  - `id` (int, primary key, autoincrement)
  - `name` (varchar 255, not null)
  - `createdBy` (int, references users_table)
  - `createdAt`, `updatedAt` (timestamps)

- Modify `formsTable`:
  - Add `folderId` (int, nullable, references folders_table with `onDelete: cascade`)

- Add `foldersRelations` for Drizzle ORM

### 2. Database Migration
After schema changes, run:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 3. API Endpoints for Folders
**New directory:** `server/api/folders/`

| Endpoint | File | Description |
|----------|------|-------------|
| GET /api/folders | `index.get.ts` | List all folders ordered by name |
| POST /api/folders | `index.post.ts` | Create folder (body: `{name, createdBy}`) |
| PATCH /api/folders/[id] | `[id].patch.ts` | Rename folder (body: `{name}`) |
| DELETE /api/folders/[id] | `[id].delete.ts` | Delete folder (cascades to forms) |

### 4. Update Forms API
**Modify existing files:**

- `server/api/forms/index.get.ts` - Add query param filtering:
  - `?folderId=5` - Forms in folder 5
  - `?folderId=null` - Unfiled forms
  - No param - All forms

- `server/api/forms/index.post.ts` - Accept optional `folderId` on create

- `server/api/forms/[id].patch.ts` - Accept `folderId` to move forms between folders

### 5. TypeScript Types
**File:** `app/types/form-builder.ts`

Add:
```typescript
interface Folder {
  id: number;
  name: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}
```

Update `Form` interface to include `folderId: number | null`

### 6. UI Components

#### 6.1 Reusable Modal Component
**New file:** `app/components/ui/Modal.vue`
- Teleport to body, backdrop, centered content
- Props: `modelValue`, `title`, `size`
- Slots: default, footer

#### 6.2 Folder Sidebar Component
**New file:** `app/components/folders/FolderSidebar.vue`
- Fixed-width sidebar (w-64) on right side (RTL)
- "All Forms" option (shows all forms)
- "Unfiled" option (shows forms with no folder)
- List of folders with hover actions (rename, delete icons)
- "New Folder" button at bottom

#### 6.3 Folder Modal (Create/Rename)
**New file:** `app/components/folders/FolderModal.vue`
- Single input for folder name
- Dual mode: create new or rename existing

#### 6.4 Delete Folder Confirmation Modal
**New file:** `app/components/folders/DeleteFolderModal.vue`
- Warning icon, folder name
- Shows count of forms that will be deleted
- Red "Delete" button

#### 6.5 Move Form Modal
**New file:** `app/components/folders/MoveFormModal.vue`
- List of folders to choose from
- "Unfiled" option
- Shows current folder selected

### 7. Update Forms List Page
**File:** `app/pages/forms/index.vue`

Major restructure:
- Add sidebar layout (flex container)
- Integrate `FolderSidebar` component
- Add state management for:
  - `selectedFolderId` (number | null | 'all')
  - Modal visibility flags
  - Currently editing/deleting folder
- Fetch folders with `useFetch('/api/folders')`
- Reactive forms fetch based on selected folder
- Add "Move" button to each form card
- Wire up all modal handlers

---

## File Summary

### New Files (9 files)
```
server/api/folders/
  index.get.ts
  index.post.ts
  [id].patch.ts
  [id].delete.ts

app/components/ui/
  Modal.vue

app/components/folders/
  FolderSidebar.vue
  FolderModal.vue
  DeleteFolderModal.vue
  MoveFormModal.vue
```

### Modified Files (6 files)
```
server/db/schema.ts
server/api/forms/index.get.ts
server/api/forms/index.post.ts
server/api/forms/[id].patch.ts
app/pages/forms/index.vue
app/types/form-builder.ts
```

---

## Verification Plan

1. **Database**: Run migration, verify `folders_table` created and `folder_id` column added to `forms_table`

2. **API Testing**: Use curl or API client to test:
   - Create folder: `POST /api/folders`
   - List folders: `GET /api/folders`
   - Create form in folder: `POST /api/forms` with `folderId`
   - Filter forms by folder: `GET /api/forms?folderId=1`
   - Move form: `PATCH /api/forms/1` with `folderId`
   - Delete folder: `DELETE /api/folders/1` (verify forms cascade deleted)

3. **UI Testing** (manual):
   - Create a folder from sidebar
   - Rename folder (hover to see edit icon)
   - Create a new form (should be unfiled by default)
   - Move form to folder using move button
   - Click folder in sidebar to filter view
   - Click "All Forms" to see all
   - Click "Unfiled" to see forms without folders
   - Delete folder containing forms, confirm cascade deletion works

4. **RTL/Hebrew**: Verify sidebar appears on right, all Hebrew text renders correctly
