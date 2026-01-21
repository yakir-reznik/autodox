# Undo/Redo Implementation Plan for Form Builder

## Overview
Add undo/redo functionality to prevent accidental data loss when auto-save triggers after unwanted changes (like deleting an element).

## Approach: Snapshot-Based History

Using **snapshot-based history** instead of command pattern because:
- Simpler to implement - no complex inverse operations needed
- Handles cascading deletes (sections with children) automatically
- Works naturally with the dual ID system (clientId/serverId)
- Guaranteed correctness when restoring state

## Files to Create

### 1. `app/composables/useHistory.ts`
Core history management composable:
- `past: HistoryEntry[]` - stack of previous states
- `future: HistoryEntry[]` - stack for redo
- `record(actionType, getCurrentState)` - capture state before mutation
- `undo()` / `redo()` - return snapshot to restore
- `canUndo` / `canRedo` - computed booleans
- Max 50 entries, auto-trims oldest
- **Action coalescing**: Rapid updates of same type (e.g., typing) grouped into single undo step (500ms threshold)

### 2. `app/composables/useKeyboardShortcuts.ts`
Keyboard shortcut handler:
- Cross-platform support (Ctrl on Windows, Cmd on Mac)
- Prevents default browser undo in text fields
- `Ctrl/Cmd + Z` → undo
- `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` → redo

## Files to Modify

### 1. `app/composables/useFormBuilder.ts`
- Import and initialize `useHistory()`
- Add `isUndoRedoOperation` flag to prevent recording during restore
- Wrap mutation functions to record history before changes:
  - `addElement()` → records before adding
  - `removeElement()` → records before removing
  - `updateElement()` → records with coalescing
  - `moveElement()` → records before moving
  - `reorderElements()` → records before reordering
  - `duplicateElement()` → records before duplicating
- Add `performUndo()` and `performRedo()` functions that:
  1. Get snapshot from history
  2. Set `isUndoRedoOperation = true`
  3. Restore elements and metadata from snapshot
  4. Set `isDirty = true` (so reverted state gets auto-saved)
  5. Set `isUndoRedoOperation = false`
- Export `canUndo`, `canRedo`, `undo`, `redo`

### 2. `app/components/form-builder/FormBuilder.vue`
- Setup keyboard shortcuts using `useKeyboardShortcuts()`
- Pass `canUndo`, `canRedo` to FormHeader
- Handle `undo` and `redo` events from FormHeader

### 3. `app/components/form-builder/FormHeader.vue`
- Add props: `canUndo: boolean`, `canRedo: boolean`
- Add emits: `undo`, `redo`
- Add undo/redo buttons before Import JSON button:
  ```
  [← Undo] [Redo →]  |  [Import JSON] [שמור]
  ```
- Use `heroicons:arrow-uturn-right` (undo) and `heroicons:arrow-uturn-left` (redo) - flipped for RTL
- Disabled state when history unavailable
- Tooltips with keyboard shortcuts

### 4. `app/types/form-builder.ts`
Add history-related types:
```typescript
export type HistoryActionType =
  | 'add_element'
  | 'remove_element'
  | 'update_element'
  | 'move_element'
  | 'reorder_elements'
  | 'duplicate_element'
  | 'update_metadata';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  actionType: HistoryActionType;
  elements: BuilderElement[];
  formMetadata: {
    title: string;
    description: string;
    status: FormStatus;
    theme: FormTheme;
  };
  selectedElementId: string | null;
}
```

## Implementation Sequence

1. **Add types** to `app/types/form-builder.ts`
2. **Create `useHistory.ts`** composable with full logic
3. **Create `useKeyboardShortcuts.ts`** composable
4. **Modify `useFormBuilder.ts`** - integrate history with all mutations
5. **Modify `FormHeader.vue`** - add undo/redo buttons
6. **Modify `FormBuilder.vue`** - wire up shortcuts and pass props

## Edge Cases Handled

| Case | Solution |
|------|----------|
| Rapid typing in property panel | Coalesce updates within 500ms |
| Section delete with children | Full snapshot captures children |
| Undo after auto-save | Works - undo restores AND marks dirty for re-save |
| New elements without server ID | Snapshots preserve clientId; mapping happens on save |
| Form metadata changes | Included in snapshots |

## Verification

1. Add several elements to a form
2. Delete an element → verify undo restores it
3. Make rapid property changes → verify they coalesce into single undo
4. Wait for auto-save → verify undo still works after save
5. Test Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z shortcuts
6. Verify redo works after undo
7. Delete a section with children → verify undo restores all
