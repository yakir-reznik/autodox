# Plan: Submission Draft (Auto-save While Filling + Admin UI)

## Context

Users filling forms lose progress on page refresh or accidental navigation. This feature auto-saves form state to the server as users type, allowing them to resume filling later. A single "submission draft" is kept per (formId, token) pair, overwritten on each save, expiring after 30 days. Admins can view draft data in the submission detail page and see a badge in the submissions table.

---

## Architecture

### Token strategy

- **Token-based submissions** (admin-created links): the submission token from the URL query param is used as the draft's key.
- **Public submissions** (no pre-existing token): generate a UUID client-side, store in `localStorage` as `draft_session_[formId]`, use as the draft key.

### Stale draft handling

When form structure changes after a draft was saved, draft values are applied field-by-field: only keys that still exist in the current `formData` are applied; unknown keys (deleted/renamed fields) are silently ignored. For repeater fields, unknown sub-field keys within each row are also filtered.

---

## Step 1 — DB schema: add `submissionDraftsTable`

**File:** `server/db/schema.ts`

Add a new Drizzle table:

```ts
export const submissionDraftsTable = mysqlTable("submission_drafts", {
  id: int("id").primaryKey().autoincrement(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  formId: int("form_id")
    .notNull()
    .references(() => formsTable.id, { onDelete: "cascade" }),
  draftData: json("draft_data").$type<Record<string, unknown>>().notNull(),
  savedAt: timestamp("saved_at").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});
```

> No migration command — ask the operator to run `pnpm db:push` or equivalent.

---

## Step 2 — API: `PUT /api/submission-drafts/[token]`

**New file:** `server/api/submission-drafts/[token].put.ts`

- Body: `{ formId: number, draftData: Record<string, unknown> }`
- Validate formId and draftData exist
- Upsert (insert or update on duplicate token):
  - `savedAt = now`
  - `expiresAt = now + 30 days`
- Returns: `{ savedAt: string }`
- No auth required (token is the secret)

---

## Step 3 — API: `GET /api/submission-drafts/[token]`

**New file:** `server/api/submission-drafts/[token].get.ts`

- Look up draft by token
- If not found or `expiresAt < now`: return `null` (200, not 404 — avoids noisy client errors)
- Returns: `{ draftData: Record<string, unknown>, savedAt: string } | null`

---

## Step 4 — API: `DELETE /api/submission-drafts/[token]`

**New file:** `server/api/submission-drafts/[token].delete.ts`

- Delete draft by token
- Idempotent (no error if not found)
- Returns: `{ success: true }`

---

## Step 5 — Update submissions list API to include draft status

**File:** `server/api/submissions.get.ts`

- LEFT JOIN `submissionDraftsTable` on `token` (and `expiresAt > now`)
- Add `hasDraft: boolean` to each submission in the response
- Both the `formId` and `userId` query paths need to include this

---

## Step 6 — Composable: `useSubmissionDraft`

**New file:** `app/composables/useSubmissionDraft.ts`

```ts
export function useSubmissionDraft(formId: Ref<number>, submissionToken: Ref<string | null>) {
  // Resolves the draft token:
  //   - If submissionToken exists: use it
  //   - Else: get/generate UUID from localStorage key `draft_session_${formId}`
  const draftToken = computed(...)

  async function loadDraft(): Promise<Record<string, unknown> | null>
  async function saveDraft(draftData: Record<string, unknown>): Promise<void>
  async function clearDraft(): Promise<void>
    // Deletes server draft + removes localStorage key if public (no submissionToken)

  return { draftToken, loadDraft, saveDraft, clearDraft }
}
```

---

## Step 7 — `FormFill.vue` integration

**File:** `app/components/form-fill/FormFill.vue`

### On mount (after form loads and prefill is applied):

1. Call `loadDraft()`
2. If draft found: apply draft data to `formData` — only assign values for keys that already exist in `formData` (stale/deleted fields are silently skipped). For repeater values (arrays), filter each row to only include sub-keys that exist in the repeater's current element config.
3. Set `draftRestored = true` (shows "Start fresh" button)

### Auto-save wiring:

- Initialize `useAutoSave` with `debounceMs: 3000` and `onSave: () => saveDraft(formData)`
- Watch `formData` (deep) → call `autoSave.triggerSave()`
- Expose `autoSave.status` for the UI indicator

### On successful submission:

- Call `clearDraft()` after submit succeeds

### "Start fresh" button (shown only when `draftRestored === true`):

- Calls `clearDraft()`
- Resets `formData` back to prefill defaults (re-apply `applyPrefill()`)
- Sets `draftRestored = false`

---

## Step 8 — Save status indicator UI

**File:** `app/components/form-fill/FormFill.vue` (inline, near the submit button area)

- `pending` / `saving`: subtle spinner + "שומר טיוטה..."
- `saved`: checkmark + "טיוטה נשמרה"
- `error`: warning icon + "שגיאה בשמירה"
- `idle`: nothing shown
- "התחל מחדש" (Start fresh) button shown when `draftRestored === true`

---

## Step 9 — Admin: Draft badge in submissions table

**File:** `app/components/submissions/Table.vue`

- Add `hasDraft?: boolean` to the `Submission` type in this component
- In the status column (next to existing status + public badges), add a "טיוטה" badge when `submission.hasDraft === true`
  - Style: e.g. `bg-amber-100 text-amber-800` with a pencil or draft icon

---

## Step 10 — Admin: Draft section + delete button in submission detail

**File:** `app/pages/submission-detail/[token].vue`

### Draft data section:

- Add a separate `useFetch` call on mount: `GET /api/submission-drafts/{token}`
- If draft exists, show a new card section "Draft Data" (similar to the existing "Submitted Data" section):
  - Display raw JSON of `draftData`
  - Show `savedAt` timestamp
  - Copy JSON button
  - "מחק טיוטה" (Delete Draft) button

### Delete Draft button:

- Calls `DELETE /api/submission-drafts/{token}`
- On success: clears the draft ref, hides the section, shows a toast

---

## Files to create

- `server/api/submission-drafts/[token].put.ts`
- `server/api/submission-drafts/[token].get.ts`
- `server/api/submission-drafts/[token].delete.ts`
- `app/composables/useSubmissionDraft.ts`

## Files to modify

- `server/db/schema.ts` — add `submissionDraftsTable`
- `server/api/submissions.get.ts` — LEFT JOIN draft table, add `hasDraft`
- `app/components/form-fill/FormFill.vue` — wire draft + auto-save + stale-field filtering + UI
- `app/components/submissions/Table.vue` — draft badge in status column
- `app/pages/submission-detail/[token].vue` — draft section + delete button

---

## Verification

1. Open a public form, fill some fields → wait 3s → refresh → confirm fields restored
2. Open a token-based form link, fill fields → refresh → confirm restored
3. Click "Start fresh" → confirm fields reset to prefill (or empty)
4. Submit the form → refresh → confirm no draft loaded (cleared on submit)
5. Check DB: `submission_drafts` row has `expires_at = saved_at + 30 days`
6. Test that a second save overwrites the first (only 1 row per token)
7. Simulate expired draft (set `expires_at` to past) → confirm auto-load is skipped
8. Delete a form element, reload the fill page → confirm stale draft key is ignored (no JS error, other fields still load)
9. Admin: submissions table shows "טיוטה" badge on rows with active drafts
10. Admin: submission detail shows draft section with data + delete button; clicking delete removes the section
