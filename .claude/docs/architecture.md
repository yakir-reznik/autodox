# Architecture

## Database Schema (Drizzle ORM + MySQL)

**Tables:**

1. **users_table** - Role-based access (admin|viewer)
2. **forms_table** - Form metadata (title, description, status, creator, timestamps)
3. **form_elements_table** - Elements with hierarchical structure

**Key Patterns:**

| Pattern | Description |
|---------|-------------|
| Dual ID System | Elements have `clientId` (temp, client-side) and `id` (database). Mapping maintained during save. |
| Fractional Positioning | Decimal `position` values (0.5, 1.0, 1.5) for drag-drop reordering without renumbering. |
| Soft Deletion | `isDeleted` flag instead of hard deletes. |
| Hierarchical Elements | `parentId` for nesting (sections contain children). |
| JSON Config | Element-specific settings in flexible `config` field. |

**Element Types (23):**

- Input: text, email, number, textarea, date, time, datetime
- Selection: dropdown, radio, checkbox, checkboxes
- Special: signature, repeater
- Layout: heading_h1, heading_h2, heading_h3, paragraph, image, video, divider, spacer, section

## Frontend Structure

**Composables** (`app/composables/`):

| File | Purpose |
|------|---------|
| `useFormBuilder.ts` | Core state management, CRUD, dual ID mapping |
| `useAutoSave.ts` | Debounced auto-save (2s) with status tracking |
| `useElementDefaults.ts` | Default configs for all element types |

**Components:**

```
app/components/
├── ui/                    # Reusable: Button, Input, Select, etc.
├── form-builder/
│   ├── FormBuilder.vue    # Root: state, auto-save, three-panel layout
│   ├── FormCanvas.vue     # Drag-drop canvas (vuedraggable)
│   ├── ElementPalette.vue # Element library with clone-based dragging
│   ├── PropertyPanel.vue  # Context-sensitive property editor
│   ├── elements/          # Render components per element type
│   └── properties/        # Property editors per element type
└── form-fill/             # Form rendering for fill mode
```

**Pages:**

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/forms` | Forms list |
| `/forms/new` | Creates form, redirects to editor |
| `/edit/[id]` | Form builder editor |
| `/fill/[id]` | Form filling interface |

## Data Flow

**Form Editing:**

1. Load form via `GET /api/forms/[id]`
2. Convert server elements to builder elements (add clientId)
3. User modifies → `isDirty` flag set
4. Auto-save debounces → `PUT /api/forms/[id]/elements`
5. Server maps tempIds to real IDs
6. Client updates local state with real IDs from response

**Element ID Mapping:**

```
New element: clientId = "temp-123"
     ↓ save
Server assigns: id = 45
     ↓ response
Returns: { tempIdMap: { "temp-123": 45 } }
     ↓ client update
Element and parent references updated with real IDs
```
