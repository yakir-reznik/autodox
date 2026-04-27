# Form Sharing Between Users

## Context

Forms are currently single-owner: only `forms.createdBy` can manage and view a form's data. We need a way for an owner to share a form with specific other users, granting subsets of access (view submissions, create submissions, manage submissions, edit the form). Only the original owner can delete the form, change its sharing, or share it further.

**Scope of this plan:** the sharing model itself — the `form_shares` data, the CRUD API for share records, and the UI for managing shares. **Out of scope:** wiring those records into endpoint authorization checks, list filtering, builder read-only mode, etc. Those are handled by `authorization-and-user-roles.md`, which now references this plan as a prerequisite (run the migration and create the share-CRUD endpoints first; the authorization rollout consumes them).

---

## Permission Model — Granular Toggles

Independent boolean permissions on each share record. More flexible than tiers and matches how users naturally describe access ("X can do A and C but not B").

### Permission flags

| Flag                  | What it grants                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `view_form`           | See the form in the user's form list and view its structure (read-only). **Implicitly granted by every share** — there is no share without at least seeing the form. |
| `view_submissions`    | View the submissions list for this form and open submission detail pages. View webhook delivery history.           |
| `create_submissions`  | Create submission links via the UI and via API key (`POST /api/forms/[id]/create-submission-link`).                |
| `manage_submissions`  | Rename, archive, resend webhook for submissions of this form.                                                      |
| `edit_form`           | Edit form metadata, settings, elements, upload-json, duplicate. Does **not** grant delete or share-management.     |

Each flag is fully independent — granting one never auto-grants another. For example, a user may have `create_submissions` without `view_submissions` (they can generate submission links but cannot see the resulting filled data).

### What is NOT shareable (owner-only)

- **Delete the form** (`DELETE /api/forms/[id]`)
- **Manage shares** (add/remove/modify share records)
- **Transfer ownership** (out of scope for this plan)

---

## Database Changes

### New table: `form_shares`

File: `server/db/schema.ts` (add alongside `formsTable`).

```ts
export const formSharesTable = mysqlTable(
  "form_shares_table",
  {
    id: int().primaryKey().autoincrement(),
    formId: int("form_id").notNull().references(() => formsTable.id, { onDelete: "cascade" }),
    granteeUserId: int("grantee_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    grantedBy: int("granted_by").notNull().references(() => usersTable.id),

    canViewSubmissions: boolean("can_view_submissions").notNull().default(false),
    canCreateSubmissions: boolean("can_create_submissions").notNull().default(false),
    canManageSubmissions: boolean("can_manage_submissions").notNull().default(false),
    canEditForm: boolean("can_edit_form").notNull().default(false),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [uniqueIndex("form_shares_form_grantee_unique").on(t.formId, t.granteeUserId)],
);
```

`view_form` is implicit — the existence of a row means the grantee can view the form.

**Operator action required:** generate + run migration (`pnpm drizzle-kit generate`, then operator runs the migration). Per project rules, do not run DB commands.

---

## Shared Types

File: `app/types/form-builder.ts`

```ts
export type FormSharePermissions = {
  canViewSubmissions: boolean;
  canCreateSubmissions: boolean;
  canManageSubmissions: boolean;
  canEditForm: boolean;
};

export type FormShare = {
  id: number;
  formId: number;
  granteeUserId: number;
  granteeEmail: string;
  granteeName: string | null;
  grantedBy: number;
  permissions: FormSharePermissions;
  createdAt: string;
  updatedAt: string;
};

export type UserSearchResult = {
  id: number;
  email: string;
  name: string | null;
};
```

---

## API Endpoints

All share-management endpoints are **owner-only** (admin bypass allowed). Authorization for these endpoints is enforced inline within this plan via a tiny helper, since the broader authorization rollout has not happened yet:

```ts
// server/utils/form-share-guard.ts (new, scoped to this plan)
export async function requireFormOwnerOrAdmin(event, formId: number) {
  const session = await requireUserSession(event);
  const form = await db.query.formsTable.findFirst({ where: eq(formsTable.id, formId) });
  if (!form) throw createError({ statusCode: 404 });
  const isAdmin = session.user.role === "admin"; // pre-roles-array; updated in auth plan
  if (!isAdmin && form.createdBy !== session.user.id) throw createError({ statusCode: 403 });
  return { session, form };
}
```

> When the authorization plan lands, this helper is replaced by `requireFormPermission(event, formId, "manage_shares")` and deleted. Until then, it keeps share-management self-contained.

### Endpoints

| Endpoint                                              | Purpose                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `GET    /api/forms/[id]/shares`                       | List existing shares for the form (joins users to return email/name).                |
| `POST   /api/forms/[id]/shares`                       | Add a share. Body: `{ granteeUserId, permissions }`. Validates not-self, not-owner.  |
| `PATCH  /api/forms/[id]/shares/[shareId]`             | Update permission flags on an existing share.                                        |
| `DELETE /api/forms/[id]/shares/[shareId]`             | Revoke a share.                                                                      |
| `GET    /api/users/search?q=...`                      | Lookup users by email/name prefix for the share dialog. Auth: any logged-in user. Returns up to 10 results. Excludes the requesting user. |

Validation rules for `POST` / `PATCH`:

- `granteeUserId !== form.createdBy` (cannot share with the owner).
- `granteeUserId !== session.user.id` (cannot share with self).
- `(form_id, grantee_user_id)` unique — `POST` returns 409 on duplicate; clients should `PATCH` instead.
- At least one of the four `can*` flags must be true on `POST` / `PATCH` (a row with all-false is meaningless beyond `view_form`; allow it but document — leaving as a "view-only share").

---

## UI

All UI is owner-only — the entry points are simply hidden for non-owners. Hebrew RTL labels matching the rest of the app.

### Sharing tab in form settings modal

File: `app/components/form-builder/FormSettingsModal.vue` — add a new "שיתוף" tab beside the existing tabs. The tab is hidden when the current user is not the form owner.

**New components (`app/components/form-builder/`):**

- `FormSharingTab.vue` — top-level tab content. Shows:
  - The list of current shares (each as `FormShareRow`).
  - "Add user" section: a user picker (search by email/name) followed by four permission checkboxes and an "Add" button.
  - Empty state when no shares exist.
- `FormShareRow.vue` — one row per existing share. Shows grantee name+email, four permission checkboxes that update on toggle (debounced PATCH), last-updated timestamp, and a "Remove" button (DELETE with confirm).
- `FormSharePermissionCheckboxes.vue` — reusable group of the four checkboxes; emits `update:permissions`. Reused by both the row and the add form so the layout/copy stays consistent.
- `FormShareUserPicker.vue` — typeahead input that calls `GET /api/users/search?q=...` (debounced ~250ms), displays the dropdown of `UserSearchResult`s, and emits `select`. Filters out users already shared with.

**New composable (`app/composables/`):**

- `useFormShares.ts` — wraps the four share endpoints for a given `formId`. Exposes:
  - `shares: Ref<FormShare[]>` (initial load via `useFetch`).
  - `addShare(granteeUserId, permissions)` → optimistic insert + POST.
  - `updateShare(shareId, permissions)` → optimistic patch + PATCH.
  - `removeShare(shareId)` → optimistic remove + DELETE.
  - `searchUsers(q)` → calls `/api/users/search`.

UX details:

- Permission checkbox toggles save immediately (debounced) — no separate "save" button.
- "Remove" requires a confirm modal (reuse the existing confirm-modal pattern in the codebase).
- Errors restore optimistic state and show a toast (reuse existing toast util).

---

## Critical Files

| File                                                  | Change                                                  |
| ----------------------------------------------------- | ------------------------------------------------------- |
| `server/db/schema.ts`                                 | Add `formSharesTable` + relation                        |
| `server/db/migrations/`                               | New migration file (operator runs)                      |
| `server/utils/form-share-guard.ts`                    | **New** — temporary `requireFormOwnerOrAdmin` helper    |
| `server/api/forms/[id]/shares/index.get.ts`           | **New** — list shares                                   |
| `server/api/forms/[id]/shares/index.post.ts`          | **New** — create share                                  |
| `server/api/forms/[id]/shares/[shareId].patch.ts`     | **New** — update share                                  |
| `server/api/forms/[id]/shares/[shareId].delete.ts`    | **New** — revoke share                                  |
| `server/api/users/search.get.ts`                      | **New** — user lookup for share dialog                  |
| `app/types/form-builder.ts`                           | Add `FormShare`, `FormSharePermissions`, `UserSearchResult` |
| `app/components/form-builder/FormSettingsModal.vue`   | Add "שיתוף" tab (owner-only)                            |
| `app/components/form-builder/FormSharingTab.vue`      | **New**                                                 |
| `app/components/form-builder/FormShareRow.vue`        | **New**                                                 |
| `app/components/form-builder/FormSharePermissionCheckboxes.vue` | **New**                                       |
| `app/components/form-builder/FormShareUserPicker.vue` | **New**                                                 |
| `app/composables/useFormShares.ts`                    | **New**                                                 |
| `.claude/plans/authorization-and-user-roles.md`       | Cross-reference updates so the auth rollout consumes `form_shares` (see that file) |

---

## Verification

1. **Type check**: `pnpm build` passes.
2. **Migration applied** by operator; `form_shares_table` exists with the unique `(form_id, grantee_user_id)` constraint.
3. **Owner UX**: as the form owner, open the form settings modal → "שיתוף" tab. Search for a second test user, grant `view_submissions + create_submissions`, save. Row appears with both checkboxes ticked.
4. **Toggle persistence**: tick `edit_form` on the existing row — refresh the modal, the change persists.
5. **Validation**: searching cannot return self; trying to add the form owner returns 400; re-adding an already-shared user returns 409 (UI should hide them from search results to prevent this).
6. **Removal**: clicking "Remove" with confirm deletes the row; the row disappears from the list.
7. **Cascade**: deleting the form (as owner) removes all `form_shares` rows for it; deleting a user removes shares granted to/by them.
8. **Non-owner**: as a non-owner who has a share, the "שיתוף" tab is hidden.
9. **API guard**: a non-owner calling any `/shares/*` endpoint directly receives 403.

> Note: making the granted permissions actually change what the grantee can do at runtime (form list inclusion, builder read-only, submission visibility, API-key checks) is the responsibility of `authorization-and-user-roles.md`. Until that plan is implemented, the share records exist but do not yet alter access.
