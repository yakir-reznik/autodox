# Authorization Plan: Per-Endpoint Role & Ownership Checks

## Context

The app currently has three roles (`admin`, `user`, `viewer`) but most API endpoints have no auth checks at all. The management panel is locked to `admin`-only via client middleware, and most backend endpoints are completely unprotected. The goal is to:

1. Change `role` (string) → `roles` (array) in the session, so admins automatically inherit user-level permissions (`["admin", "user"]`), simplifying all "user or admin" checks to `roles.includes("user")`.
2. Add server-side authorization to every endpoint using a permission model that combines ownership with **form sharing**: a user has access if they own the form, are admin, or have a `form_shares` row granting the relevant permission. Resources without a sharing model (folders, own profile) stay pure-ownership.
3. Open the management panel to `user` role (client middleware update).

**Prerequisite plan:** `form-share-sharing-between-users.md` — that plan introduces the `form_shares_table` and the share-management API/UI. Its migration must be applied before this plan's endpoint checks ship, since several helpers below read `form_shares`.

**No DB migration needed in this plan** — the DB column stays as a single `role` enum. The expansion to an array happens only when building the session. (The `form_shares` migration is owned by the prerequisite plan.)

---

## Role Semantics

| Role     | Access                                                               |
| -------- | -------------------------------------------------------------------- |
| `admin`  | Full access to all resources. Session `roles: ["admin", "user"]`     |
| `user`   | Access own forms/folders/submissions only. Session `roles: ["user"]` |
| `viewer` | Future read-only role. For now: redirect to `/` after login          |

---

## Endpoint Access Rules

### Public (no auth — no changes)

| Endpoint                               | Notes                                           |
| -------------------------------------- | ----------------------------------------------- |
| `GET /api/health`                      |                                                 |
| `POST /api/auth/login`                 |                                                 |
| `POST /api/auth/logout`                |                                                 |
| `GET /api/auth/session`                |                                                 |
| `POST /api/auth/signup`                | Disabled in logic, stays public                 |
| `GET /api/forms/[id]`                  | Form viewer — handles token/password internally |
| `GET /api/forms/[id]/theme.css`        |                                                 |
| `POST /api/forms/[id]/verify-password` |                                                 |
| `GET /api/forms/[id]/settings`         | Used by public form fill                        |
| `POST /api/forms/[id]/entrances`       | Analytics recording during form fill (public)   |
| `POST /api/submissions/[token]/start`  | Public submitter                                |
| `POST /api/submissions/[token]/submit` | Public submitter                                |
| `GET /api/[...].ts`                    | 404 catch-all                                   |

### API-key auth (permission check needed)

| Endpoint                                      | Notes                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| `POST /api/forms/[id]/create-submission-link` | Uses `x-api-key` header — user must have `create_submissions` (owner / admin / share) |

### Admin only

| Endpoint                                            | Currently                            |
| --------------------------------------------------- | ------------------------------------ |
| `GET /api/admin/reports/external-ids`               | ✅ has check — update to use utility |
| `GET /api/admin/reports/submissions-by-external-id` | ✅ has check — update to use utility |
| `GET /api/submissions/[token]/download-pdf`         | ✅ has check — update to use utility |
| `PATCH /api/submissions/[token]/archive`            | ✅ has check — update to use utility |
| `POST /api/submissions/[token]/resend-webhook`      | ✅ has check — update to use utility |
| `GET /api/webhook-deliveries/[id]`                  | ✅ has check — update to use utility |

### User+ (permission-aware) — ADD checks

Form endpoints resolve through `form_shares` in addition to ownership/admin. The required permission per endpoint is listed below; helpers in Step 2 do the lookup.

| Endpoint                                       | Required permission                                                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `GET /api/forms`                               | `roles.includes("user")`. Returns owned ∪ shared (admin: all). Each row carries `isOwner` + `permissions`. |
| `POST /api/forms`                              | `roles.includes("user")`. Creator becomes owner.                                                           |
| `GET /api/forms/[id]` (authenticated UI fetch) | `view` (owner / admin / any share row). Public token/password path is unchanged. ✅                        |
| `PATCH /api/forms/[id]`                        | `edit_form` ✅                                                                                             |
| `DELETE /api/forms/[id]`                       | **Owner or admin only**                                                                                    |
| `PUT /api/forms/[id]/elements`                 | `edit_form`                                                                                                |
| `POST /api/forms/[id]/duplicate`               | `view` (new copy's `createdBy = session.user.id`)                                                          |
| `GET /api/forms/[id]/export-json`              | `view`                                                                                                     |
| `POST /api/forms/[id]/upload-json`             | `edit_form`                                                                                                |
| `POST /api/forms/upload-json`                  | `roles.includes("user")`                                                                                   |
| `GET /api/folders`                             | `roles.includes("user")` (folders are not shared)                                                          |
| `POST /api/folders`                            | `roles.includes("user")`                                                                                   |
| `PATCH /api/folders/[id]`                      | `roles.includes("user")` + own folder or admin                                                             |
| `DELETE /api/folders/[id]`                     | `roles.includes("user")` + own folder or admin                                                             |
| `GET /api/submissions` (`formId`)              | `view_submissions` on form                                                                                 |
| `GET /api/submissions` (`userId`)              | Self or admin (unchanged)                                                                                  |
| `GET /api/submissions?sharedWithMe=true`       | `roles.includes("user")` — returns submissions for any form with `view_submissions`                        |
| `GET /api/submissions/[token]/details`         | `view_submissions` (Puppeteer header bypass stays)                                                         |
| `PATCH /api/submissions/[token]/rename`        | `manage_submissions`                                                                                       |
| `PATCH /api/submissions/[token]/archive`       | `manage_submissions` (loosen from current admin-only)                                                      |
| `POST /api/submissions/[token]/resend-webhook` | `manage_submissions`                                                                                       |
| `GET /api/submissions/[token]/download-pdf`    | `view_submissions` (loosen from admin-only)                                                                |
| `GET /api/webhook-deliveries/[id]`             | `view_submissions` on the related form (loosen from admin-only)                                            |
| `POST /api/uploads`                            | `roles.includes("user")`                                                                                   |

### Share-management endpoints (created by `form-share-sharing-between-users.md`)

| Endpoint                                  | Required permission                     |
| ----------------------------------------- | --------------------------------------- |
| `GET    /api/forms/[id]/shares`           | `manage_shares` (owner or admin)        |
| `POST   /api/forms/[id]/shares`           | `manage_shares`                         |
| `PATCH  /api/forms/[id]/shares/[shareId]` | `manage_shares`                         |
| `DELETE /api/forms/[id]/shares/[shareId]` | `manage_shares`                         |
| `GET    /api/users/search`                | `roles.includes("user")` (rate-limited) |

When this plan ships, replace the temporary `requireFormOwnerOrAdmin` helper in those endpoints with `requireFormPermission(event, formId, "manage_shares")` and delete `server/utils/form-share-guard.ts`.

### Any authenticated user (own account only)

| Endpoint                           | Notes                                  |
| ---------------------------------- | -------------------------------------- |
| `GET /api/user/profile`            | Already has manual check — standardize |
| `PATCH /api/user/profile`          | Already has manual check — standardize |
| `POST /api/user/change-password`   | Already has manual check — standardize |
| `POST /api/user/disconnect-google` | Already has manual check — standardize |
| `POST /api/user/reroll-api-key`    | Already has manual check — standardize |

---

## Implementation Steps

### Step 1 — Update session type - ✅ Done

**File:** `shared/types/auth.d.ts`

- Change `role: UserRole` → `roles: UserRole[]`

### Step 2 — Update authorization utility - ✅ Done

**File:** `server/utils/authorization.ts`

Replace/add:

```ts
function expandRoles(role: UserRole): UserRole[] {
  return role === "admin" ? ["admin", "user"] : [role];
}

type FormPermission =
  | "view" // owner / admin / any share row
  | "view_submissions"
  | "create_submissions"
  | "manage_submissions"
  | "edit_form"
  | "delete" // owner / admin only
  | "manage_shares"; // owner / admin only

// Throws 403 if user has none of the required roles
async function requireRoles(event, required: UserRole[]): Promise<session>;

// Returns the union of permissions the current user has for a form.
// Owner → all. Admin → all. Otherwise: derived from form_shares row (if any).
async function getFormPermissions(
  userId: number,
  formId: number,
  isAdmin: boolean,
): Promise<Set<FormPermission>>;

// Throws 403 if user lacks the named permission. Returns { session, form, permissions }.
async function requireFormPermission(
  event,
  formId: number,
  perm: FormPermission,
): Promise<{ session; form; permissions: Set<FormPermission> }>;

// Same but resolves form via submission token first.
async function requireSubmissionPermission(
  event,
  token: string,
  perm: FormPermission,
): Promise<{ session; submission; form; permissions: Set<FormPermission> }>;

// For API-key authenticated endpoints: extracts x-api-key header, looks up user,
// fetches form, then checks the resolved user has `perm` (owner / admin / share).
// No session involved — used by create-submission-link.
async function requireApiKeyFormPermission(
  event,
  formId: number,
  perm: FormPermission,
): Promise<{ user; form; permissions: Set<FormPermission> }>;
```

Remove `requireUserRole` (replaced by `requireRoles`). Keep `getUserRole` / `hasUserRole` but update to work with `roles` array. Delete the temporary `server/utils/form-share-guard.ts` from the prerequisite plan and switch share endpoints to `requireFormPermission(event, formId, "manage_shares")`.

### Step 3 — Update all `setUserSession` calls - ✅ Done

**5 files** — replace `role: user.role` with `roles: expandRoles(user.role)`:

- `server/api/auth/login.post.ts`
- `server/api/auth/signup.post.ts`
- `server/api/user/profile.patch.ts`
- `server/api/user/reroll-api-key.post.ts`
- `server/routes/auth/google.get.ts`

### Step 4 — Update client middleware

**File:** `app/middleware/auth.global.ts`

- Change all `user.value?.role === "admin"` → `user.value?.roles.includes("admin")`
- Change management panel gate from `role !== "admin"` → `!roles.includes("user")` (allows user + admin, redirects viewer)

### Step 4b — Frontend 401/403 error handling ✅ Done

**File:** `app/plugins/management-panel-unauthorized-error-redirect.ts` — **already implemented**

A global `$fetch` interceptor catches 401 and 403 responses and redirects to `/manage/unauthorized` whenever the current route is under `/manage/**`. Fill routes and other public pages are unaffected by the route guard.

Do **not** add any inline redirect-to-unauthorized logic in pages, composables, or other plugins — the plugin handles this centrally.

### Step 5 — Add/update endpoint checks

Work through the endpoint table above. The pattern is:

**Admin-only** (use utility):

```ts
await requireRoles(event, ["admin"]);
```

**User-or-admin** (use utility):

```ts
await requireRoles(event, ["user"]); // works because admin has ["admin","user"]
```

**Permission check** (use utility):

```ts
const { session, form, permissions } = await requireFormPermission(event, formId, "edit_form");
```

**Own-account endpoints** (`/user/*`):

```ts
const session = await requireUserSession(event); // nuxt-auth-utils built-in
```

**`GET /api/forms`** — return owned ∪ shared:

```ts
const session = await requireRoles(event, ["user"]);
const isAdmin = session.user.roles.includes("admin");
// admin: SELECT all forms
// user: LEFT JOIN form_shares ON form_shares.form_id = forms.id
//       WHERE forms.created_by = userId OR form_shares.grantee_user_id = userId
// each row carries: isOwner (createdBy === userId) and permissions (from share row, or all-true if owner/admin)
```

`FormListItem` (in `app/types/form-builder.ts`) gains:

```ts
isOwner: boolean;
permissions: FormSharePermissions; // from form-share plan; all-true for owner/admin
```

**`GET /api/submissions`** — three modes:

- `formId`: `requireFormPermission(event, formId, "view_submissions")`.
- `userId`: must equal `session.user.id` or admin (unchanged).
- `sharedWithMe=true`: list all `form_shares` rows where grantee = self with `canViewSubmissions`, then return submissions for those forms (admin: not applicable — admin uses `formId` directly).

### Step 5b — Builder read-only mode

`GET /api/forms/[id]` returns the `permissions` object alongside the form. The form-builder page (`app/pages/forms/[id]/edit.vue` or wherever the builder lives) reads `permissions.canEditForm` and passes a `readOnly` prop to the top-level form-builder component when false: lock element drag/drop, hide Save, hide settings modal's destructive options. Reuse existing disabled states.

### Step 5c — Forms list UI

`app/pages/forms/index.vue`:

- Add a "Shared with me" filter alongside folders.
- On non-owned cards, show a "Shared by {ownerName}" badge.
- Hide owner-only actions (delete, share, transfer) in the per-form dropdown when `!isOwner`.

### Step 6 — Sweep for inline auth logic

After all endpoint changes are done, grep every modified file to confirm no authorization is done outside of `server/utils/authorization.ts`:

- No `session.user.role === "..."` or `session.user.roles.includes(...)` comparisons outside the utility
- No manual `x-api-key` header extraction / DB user lookups outside `requireApiKeyFormPermission`
- No bare `requireUserSession` calls followed by inline role or ownership checks (the only valid bare use is `/user/*` own-account endpoints)
- `server/utils/form-share-guard.ts` is deleted; share endpoints call `requireFormPermission(..., "manage_shares")`

Fix any violations found before considering the step complete.

---

## Critical Files

| File                                                          | Change                                                                                                                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/types/auth.d.ts`                                      | `role` → `roles: UserRole[]`                                                                                                                            |
| `server/utils/authorization.ts`                               | New helpers: `requireRoles`, `expandRoles`, `getFormPermissions`, `requireFormPermission`, `requireSubmissionPermission`, `requireApiKeyFormPermission` |
| `server/utils/form-share-guard.ts`                            | **Delete** (was the temporary helper from the prerequisite plan)                                                                                        |
| `server/api/auth/login.post.ts`                               | Session build                                                                                                                                           |
| `server/api/auth/signup.post.ts`                              | Session build                                                                                                                                           |
| `server/api/user/profile.patch.ts`                            | Session build                                                                                                                                           |
| `server/api/user/reroll-api-key.post.ts`                      | Session build                                                                                                                                           |
| `server/routes/auth/google.get.ts`                            | Session build                                                                                                                                           |
| `app/middleware/auth.global.ts`                               | Gate logic (admin → user+)                                                                                                                              |
| `server/api/forms/index.get.ts`                               | Union owned + shared; include `isOwner` + `permissions` per row                                                                                         |
| `server/api/forms/[id].get.ts`                                | Apply `view`; include `permissions` field                                                                                                               |
| `server/api/forms/[id].patch.ts`                              | Apply `edit_form`                                                                                                                                       |
| `server/api/forms/[id].delete.ts`                             | Owner-or-admin only                                                                                                                                     |
| `server/api/forms/[id]/elements.put.ts`                       | Apply `edit_form`                                                                                                                                       |
| `server/api/forms/[id]/duplicate.post.ts`                     | Apply `view`                                                                                                                                            |
| `server/api/forms/[id]/upload-json.post.ts`                   | Apply `edit_form`                                                                                                                                       |
| `server/api/forms/[id]/create-submission-link.post.ts`        | Replace manual auth + form fetch with `requireApiKeyFormPermission(..., "create_submissions")`                                                          |
| `server/api/forms/[id]/shares/*`                              | Switch from `requireFormOwnerOrAdmin` to `requireFormPermission(..., "manage_shares")`                                                                  |
| `server/api/submissions.get.ts`                               | Permission-aware filter; support `sharedWithMe`                                                                                                         |
| `server/api/submissions/[token]/*.ts`                         | Apply per-action submission permission                                                                                                                  |
| `server/api/webhook-deliveries/[id].get.ts`                   | Apply `view_submissions`                                                                                                                                |
| `app/types/form-builder.ts`                                   | `FormListItem` gains `isOwner` + `permissions`                                                                                                          |
| `app/pages/forms/index.vue`                                   | "Shared with me" filter + ownership badges + action gating                                                                                              |
| `app/pages/forms/[id]/edit.vue`                               | Read-only mode wiring driven by `permissions.canEditForm`                                                                                               |
| `app/plugins/management-panel-unauthorized-error-redirect.ts` | ✅ Done — intercepts 401/403 in `/manage/**` and redirects to `/manage/unauthorized`                                                                    |
| `app/pages/manage/unauthorized.vue`                           | Unauthorized page (already scaffolded)                                                                                                                  |
| All other endpoint files listed above                         | Auth checks per the table                                                                                                                               |

---

## Verification

1. **Type check**: `pnpm build` passes with no type errors on `roles` everywhere
2. **Login as admin**: session has `roles: ["admin", "user"]`; all endpoints accessible
3. **Login as user**: session has `roles: ["user"]`; management panel accessible; sees own forms ∪ forms shared with them
4. **Unauthenticated**: protected endpoints return 401; public endpoints still work
5. **Form fill**: public form fill (`/fill/[id]`) still works without login
6. **Viewer role**: logs in but gets redirected to `/`
7. **Sharing happy path** (depends on prerequisite plan): owner shares form to user B with `view_submissions + create_submissions`. User B:
   - Sees the form with a "Shared" badge and no delete option
   - Builder is read-only (no Save)
   - Can list submissions and create submission links via UI and via their own API key
   - Cannot rename/archive/resend-webhook (403)
8. **Edit-only share**: user C with only `edit_form` can save form structure changes but does not see submissions
9. **Owner-only ops**: shared users get 403 on `DELETE /api/forms/[id]` and on any `/shares/*` mutation
10. **Revocation**: owner removes share — affected user's next request returns 403; the form disappears from their list
11. **Inline auth sweep (Step 6)** comes back clean
