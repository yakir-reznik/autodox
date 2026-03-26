# Plan: Submission Draft (Auto-save While Filling)

## Context

Users filling forms lose progress on page refresh or accidental navigation. This feature auto-saves form state to the server as users type, allowing them to resume filling later. A single "submission draft" is kept per (formId, token) pair, overwritten on each save, expiring after 30 days.

---

## Architecture

### Token strategy

- **Token-based submissions** (admin-created links): the submission token from the URL query param is used as the draft's key.
- **Public submissions** (no pre-existing token): generate a UUID client-side, store in `localStorage` as `draft_session_[formId]`, use as the draft key.

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
- If not found or `expiresAt < now`: return `null` (200, not 404 — avoids noisy errors)
- Returns: `{ draftData: Record<string, unknown>, savedAt: string } | null`

---

## Step 4 — API: `DELETE /api/submission-drafts/[token]`

**New file:** `server/api/submission-drafts/[token].delete.ts`

- Delete draft by token
- Idempotent (no error if not found)
- Returns: `{ success: true }`

---

## Step 5 — Composable: `useSubmissionDraft`

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
    // Deletes server draft + removes localStorage key if public

  return { draftToken, loadDraft, saveDraft, clearDraft }
}
```

---

## Step 6 — `FormFill.vue` integration

**File:** `app/components/form-fill/FormFill.vue`

### On mount (after form loads and prefill is applied):

1. Call `loadDraft()`
2. If draft found:
   - Merge draft data into `formData` (draft data takes precedence over prefill)
   - Set `draftRestored = true` (shows "Start fresh" button)

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

## Step 7 — Save status indicator UI

**File:** `app/components/form-fill/FormFill.vue` (or extract a small component)

Show a small inline indicator near the submit button area:

- `pending` / `saving`: subtle spinner + "שומר טיוטה..."
- `saved`: checkmark + "טיוטה נשמרה"
- `error`: warning icon + "שגיאה בשמירה"
- `idle`: nothing shown

Also show a "התחל מחדש" (Start fresh) button when `draftRestored === true`.

---

## Files to create

- `server/api/submission-drafts/[token].put.ts`
- `server/api/submission-drafts/[token].get.ts`
- `server/api/submission-drafts/[token].delete.ts`
- `app/composables/useSubmissionDraft.ts`

## Files to modify

- `server/db/schema.ts` — add `submissionDraftsTable`
- `app/components/form-fill/FormFill.vue` — wire draft + auto-save + UI

---

## Verification

1. Open a public form, fill some fields → wait 3s → refresh → confirm fields restored
2. Open a token-based form link, fill fields → refresh → confirm restored
3. Click "Start fresh" → confirm fields reset to prefill (or empty)
4. Submit the form → refresh → confirm no draft loaded (cleared on submit)
5. Check DB: `submission_drafts` row has `expires_at = saved_at + 30 days`
6. Test that a second save overwrites the first (only 1 row per token)
7. Simulate expired draft (set `expires_at` to past) → confirm auto-load is skipped
