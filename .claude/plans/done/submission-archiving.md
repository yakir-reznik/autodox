# Submission Archiving Feature

## Context

The submissions table has a disabled "העברה לארכיון" action in the more-actions dropdown with no implementation behind it. We need to implement full archiving support: toggling archive/restore on individual submissions, filtering the list to show archived vs. active, displaying a visual badge for archived submissions, and blocking archived submissions from being filled.

Design decisions:

- `isArchived` boolean + `archivedAt` timestamp (separate from `status`, preserves fill state)
- Any submission status can be archived
- Reversible (archive ↔ restore toggle)

---

## Step 1 — Database schema (`server/db/schema.ts`) ✅

Add two fields to `submissionsTable` after `lockedAt`:

```ts
isArchived: boolean("is_archived").notNull().default(false),
archivedAt: timestamp("archived_at"),
```

> **Operator action required**: Run the migration after this change.

---

## Step 2 — Submission type (`app/types/Submission.ts`) ✅

Add to the `Submission` interface:

```ts
isArchived: boolean;
archivedAt: string | null;
```

---

## Step 3 — Archive toggle API (`server/api/submissions/[token]/archive.patch.ts`) ✅

New endpoint: `PATCH /api/submissions/:token/archive`

- Requires admin session
- Fetches submission by token (404 if not found)
- Toggles `isArchived` (and sets/clears `archivedAt`)
- Returns updated submission fields `{ isArchived, archivedAt }`

---

## Step 4 — Update submissions list API (`server/api/submissions.get.ts`) ✅

- Accept new query param `archived` (default `"false"`)
- Add `eq(submissionsTable.isArchived, archived === "true")` to `conditions`
- Add `isArchived` and `archivedAt` to both SELECT branches (needsJoin and non-join)

---

## Step 5 — Block archived submissions in fill flow ✅

**`server/api/forms/[id].get.ts`** — after the `isLocked` line (~line 71):

```ts
isArchived = submission.isArchived;
```

Return `isArchived` in the response object.

**`server/api/submissions/[token]/start.post.ts`** — after the locked check, add:

```ts
if (submission.isArchived) {
  throw createError({ statusCode: 403, message: "Submission is archived" });
}
```

**`server/api/submissions/[token]/submit.post.ts`** — same pattern after the locked check.

---

## Step 6 — FormFill component (`app/components/form-fill/FormFill.vue`) ✅

After the `isLocked` check (~line 78-82), add a parallel check for `isArchived`:

```ts
if ("isArchived" in form.value && form.value.isArchived) {
  isArchived.value = true;
  return;
}
```

Add `isArchived` ref and a matching error UI block similar to the "already locked" message (Hebrew: "הגשה זו הועברה לארכיון").

---

## Step 7 — Table component (`app/components/submissions/Table.vue`) ✅

1. **Archived badge** — in the status cell alongside the existing status badge and `isPublic` badge:

```vue
<span
  v-if="submission.isArchived"
  class="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-medium flex items-center gap-1"
  title="הגשה בארכיון"
>
  <Icon name="heroicons:archive-box" class="h-3 w-3" />
  ארכיון
</span>
```

2. **Hide "הצגת טופס" button** for archived — update condition on line 133:

```vue
v-if="!['submitted', 'locked'].includes(submission.status) && !submission.isArchived"
```

3. **Enable archive/restore dropdown item** — replace the disabled item (lines 203-212) with:

```vue
<UiDropdownMenuItem @click="toggleArchive(submission)">
  <Icon :name="submission.isArchived ? 'heroicons:archive-box-x-mark' : 'heroicons:archive-box-arrow-down'" class="h-4 w-4 ml-2" />
  {{ submission.isArchived ? 'שחזור מארכיון' : 'העברה לארכיון' }}
</UiDropdownMenuItem>
```

4. **`toggleArchive` function** in `<script setup>`:

```ts
async function toggleArchive(submission: Submission) {
  await $fetch(`/api/submissions/${submission.token}/archive`, { method: "PATCH" });
  emit("refresh");
}
```

5. **Emit `refresh`** — add `"refresh"` to the `defineEmits` if not already present.

---

## Step 8 — Submissions page (`app/pages/submissions/form/[form_id].vue`) ✅

1. Add `showArchived` ref (default `false`).

2. Update the fetch URL:

```ts
() => `/api/submissions?formId=${formId}&page=${currentPage.value}&archived=${showArchived.value}`;
```

3. Reset `currentPage` to 1 when `showArchived` toggles:

```ts
watch(showArchived, () => {
  currentPage.value = 1;
});
```

4. Add toggle button in the action bar (next to refresh button):

```vue
<BaseButton variant="secondary" @click="showArchived = !showArchived">
  <Icon :name="showArchived ? 'heroicons:inbox' : 'heroicons:archive-box'" class="h-4 w-4" />
  {{ showArchived ? 'הצג פעיל' : 'הצג ארכיון' }}
</BaseButton>
```

---

## Files to modify

| File                                              | Change                                        |
| ------------------------------------------------- | --------------------------------------------- |
| `server/db/schema.ts`                             | Add `isArchived`, `archivedAt` fields         |
| `app/types/Submission.ts`                         | Add `isArchived`, `archivedAt` to type        |
| `server/api/submissions.get.ts`                   | Filter by `archived` param, select new fields |
| `server/api/submissions/[token]/archive.patch.ts` | **New file** — toggle archive                 |
| `server/api/forms/[id].get.ts`                    | Return `isArchived` in response               |
| `server/api/submissions/[token]/start.post.ts`    | Block archived                                |
| `server/api/submissions/[token]/submit.post.ts`   | Block archived                                |
| `app/components/form-fill/FormFill.vue`           | Check `isArchived`, show error                |
| `app/components/submissions/Table.vue`            | Badge, hide button, dropdown action           |
| `app/pages/submissions/form/[form_id].vue`        | Archive toggle button + filter param          |

---

## Verification

1. Archive a submission → badge appears, "הצגת טופס" hidden, action changes to "שחזור מארכיון"
2. Toggle to archive view → only archived submissions shown
3. Toggle back → archived submission gone from active list
4. Restore → badge removed, back in active list
5. Visit fill URL for archived submission → blocked with archived error message
6. Visit fill URL for non-archived submission → works normally
