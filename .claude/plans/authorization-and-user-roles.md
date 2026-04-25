# Authorization Plan: Per-Endpoint Role & Ownership Checks

## Context

The app currently has three roles (`admin`, `user`, `viewer`) but most API endpoints have no auth checks at all. The management panel is locked to `admin`-only via client middleware, and most backend endpoints are completely unprotected. The goal is to:

1. Change `role` (string) → `roles` (array) in the session, so admins automatically inherit user-level permissions (`["admin", "user"]`), simplifying all "user or admin" checks to `roles.includes("user")`.
2. Add server-side authorization to every endpoint using a consistent ownership model: **admin sees all; user sees only their own resources**.
3. Open the management panel to `user` role (client middleware update).

**No DB migration needed** — the DB column stays as a single `role` enum. The expansion to an array happens only when building the session.

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

### API-key auth (ownership check needed)

| Endpoint                                      | Notes                                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------------------- |
| `POST /api/forms/[id]/create-submission-link` | Uses `x-api-key` header — add ownership check: user must own the form or be admin |

### Admin only

| Endpoint                                            | Currently                            |
| --------------------------------------------------- | ------------------------------------ |
| `GET /api/admin/reports/external-ids`               | ✅ has check — update to use utility |
| `GET /api/admin/reports/submissions-by-external-id` | ✅ has check — update to use utility |
| `GET /api/submissions/[token]/download-pdf`         | ✅ has check — update to use utility |
| `PATCH /api/submissions/[token]/archive`            | ✅ has check — update to use utility |
| `POST /api/submissions/[token]/resend-webhook`      | ✅ has check — update to use utility |
| `GET /api/webhook-deliveries/[id]`                  | ✅ has check — update to use utility |

### User+ (own resource OR admin) — ADD checks

| Endpoint                                | Rule                                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `GET /api/forms`                        | `roles.includes("user")`; admin returns all, user filters `WHERE createdBy = user.id`                   |
| `POST /api/forms`                       | `roles.includes("user")`                                                                                |
| `PATCH /api/forms/[id]`                 | `roles.includes("user")` + own form or admin                                                            |
| `DELETE /api/forms/[id]`                | `roles.includes("user")` + own form or admin                                                            |
| `PUT /api/forms/[id]/elements`          | `roles.includes("user")` + own form or admin                                                            |
| `POST /api/forms/[id]/duplicate`        | `roles.includes("user")` + own form or admin                                                            |
| `GET /api/forms/[id]/export-json`       | ✅ already has check — update to use utility                                                            |
| `POST /api/forms/[id]/upload-json`      | `roles.includes("user")` + own form or admin                                                            |
| `POST /api/forms/upload-json`           | `roles.includes("user")`                                                                                |
| `GET /api/folders`                      | `roles.includes("user")`                                                                                |
| `POST /api/folders`                     | `roles.includes("user")`                                                                                |
| `PATCH /api/folders/[id]`               | `roles.includes("user")` + own folder or admin                                                          |
| `DELETE /api/folders/[id]`              | `roles.includes("user")` + own folder or admin                                                          |
| `GET /api/submissions`                  | `roles.includes("user")`; if `formId`: must own form or admin; if `userId`: must match user.id or admin |
| `GET /api/submissions/[token]/details`  | `roles.includes("user")` + own form or admin (Puppeteer header bypass stays)                            |
| `PATCH /api/submissions/[token]/rename` | `roles.includes("user")` + own form or admin                                                            |
| `POST /api/uploads`                     | `roles.includes("user")`                                                                                |

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

### Step 1 — Update session type

**File:** `shared/types/auth.d.ts`

- Change `role: UserRole` → `roles: UserRole[]`

### Step 2 — Update authorization utility

**File:** `server/utils/authorization.ts`

Replace/add:

```ts
function expandRoles(role: UserRole): UserRole[] {
  return role === "admin" ? ["admin", "user"] : [role];
}

// Throws 403 if user has none of the required roles
async function requireRoles(event, required: UserRole[]): Promise<session>;

// Throws 403 if user is not "user"+ AND does not own the form (admin bypasses)
// Returns { session, form } so callers don't re-fetch
async function requireFormAccess(event, formId: number): Promise<{ session; form }>;

// Same but for a submission token — fetches submission → form → checks ownership
async function requireSubmissionAccess(
  event,
  token: string,
): Promise<{ session; submission; form }>;

// For API-key authenticated endpoints: extracts x-api-key header, looks up user,
// fetches form, checks ownership (admin bypasses). Returns { user, form }.
// No session involved — used only by create-submission-link.
async function requireApiKeyFormAccess(
  event,
  formId: number,
): Promise<{ user; form }>;
```

Remove `requireUserRole` (replaced by `requireRoles`). Keep `getUserRole` / `hasUserRole` but update to work with `roles` array.

### Step 3 — Update all `setUserSession` calls

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

**Ownership check** (use utility):

```ts
const { session, form } = await requireFormAccess(event, formId);
```

**Own-account endpoints** (`/user/*`):

```ts
const session = await requireUserSession(event); // nuxt-auth-utils built-in
```

For `GET /api/forms` and `GET /api/submissions` — add conditional filtering after role check:

```ts
const isAdmin = session.user.roles.includes("admin");
// if (!isAdmin) add WHERE createdBy = session.user.id to query
```

---

## Critical Files

| File                                     | Change                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| `shared/types/auth.d.ts`                 | `role` → `roles: UserRole[]`                                                               |
| `server/utils/authorization.ts`          | New helpers: `requireRoles`, `requireFormAccess`, `requireSubmissionAccess`, `expandRoles` |
| `server/api/auth/login.post.ts`          | Session build                                                                              |
| `server/api/auth/signup.post.ts`         | Session build                                                                              |
| `server/api/user/profile.patch.ts`       | Session build                                                                              |
| `server/api/user/reroll-api-key.post.ts` | Session build                                                                              |
| `server/routes/auth/google.get.ts`       | Session build                                                                              |
| `app/middleware/auth.global.ts`          | Gate logic (admin → user+)                                                                 |
| `server/api/forms/[id]/create-submission-link.post.ts` | Replace manual auth + form fetch with `requireApiKeyFormAccess` |
| All 20+ endpoint files listed above      | Auth checks                                                                                |

---

## Verification

1. **Type check**: `pnpm build` should pass with no type errors on `roles` everywhere
2. **Login as admin**: session should have `roles: ["admin", "user"]`; all endpoints accessible
3. **Login as user**: session should have `roles: ["user"]`; management panel accessible, can only see/edit own forms
4. **Unauthenticated**: protected endpoints return 401; public endpoints still work
5. **Form fill**: public form fill (`/fill/[id]`) still works without login
6. **Viewer role**: logs in but gets redirected to `/`
