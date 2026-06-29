# Tests Plan: Expanding Vitest Coverage

## Context

The project currently has integration tests for auth, authorization, form CRUD, and form sharing — all hitting the real dev server via HTTP. The most critical business logic with zero test coverage is: form element management (the dual-ID system), the submission flow (public/token-based), folder management, and form lifecycle rules (status, expiration, password protection).

All new tests follow the same pattern as existing ones: real HTTP requests to `http://localhost:3000`, using the `api`/`apiRequest`/`login` helpers from `tests/helpers/client.ts`, with cleanup in `afterAll`.

---

## Files to Create

| File | What it tests |
|------|--------------|
| `tests/form-elements.test.ts` | `PUT /api/forms/[id]/elements` — dual ID system, parent refs, soft delete |
| `tests/submissions.test.ts` | `POST /api/forms/[id]/submit`, `POST /api/submissions/[token]/start`, status transitions |
| `tests/folders.test.ts` | `POST/GET/DELETE /api/folders`, folder-based form filtering |
| `tests/form-lifecycle.test.ts` | Published/draft enforcement, form duplication |

## Existing helpers to reuse

- `tests/helpers/client.ts` — `login`, `api`, `apiRequest`, `unauthRequest`, `ADMIN`, `USER`, `USER2`

---

## Step 1 — Form Elements (`tests/form-elements.test.ts`) ✅

Tests `PUT /api/forms/[id]/elements`.

**Setup**: Admin creates a form; tests run within it; form deleted in `afterAll`.

### Scenarios

**Saving elements**
- PUT with a single text element (clientId = `"temp-1"`) → 200, response contains `{ "temp-1": <realId> }`
- PUT with a section (parent) and a child element → response maps both temp IDs correctly; child's `parentId` in DB matches the resolved parent ID
- PUT empty `elements: []` to soft-delete all → subsequent GET returns no elements

**Permissions**
- Non-owner (USER2 without share) PUT → 403
- Grantee without `canEditForm` PUT → 403
- Grantee with `canEditForm` PUT → 200

**Soft delete**
- Save two elements, then PUT with one element omitted (not in payload) → that element is soft-deleted (GET no longer returns it)

---

## Step 2 — Submissions (`tests/submissions.test.ts`) ✅

Tests the form fill flow end-to-end.

**Setup**: Admin creates and **publishes** a form (`status: "published"`, `allowPublicSubmissions: true`).

### Scenarios

**Token-based submission (managed)**
- POST `/api/forms/[id]/submit` with a valid submission token → 200, submission status becomes `"locked"`
- POST `/api/submissions/[token]/start` → 200, status becomes `"in_progress"` (only if was `"pending"`)
- Calling `/start` again after `in_progress` → still 200 but no status change (idempotent)

**Draft form guard**
- Create a form with `status: "draft"`, POST `/api/forms/[id]/submit` → 422/400 (form not published)

**Submission lifecycle**
- Archive a submission via `PATCH /api/submissions/[token]/archive` (admin) → 200
- After archive: POST `/api/forms/[id]/submit` with that token → error (archived)

**Admin access**
- Admin can GET `/api/submissions/[token]/details` for any submission
- Regular user without permission gets 403

---

## Step 3 — Folders (`tests/folders.test.ts`) ✅

Tests `POST/GET/PATCH/DELETE /api/folders`.

**Setup**: Login as USER and ADMIN in `beforeAll`.

### Scenarios

**CRUD**
- POST `/api/folders` → 201, returns folder with `id` and `name`
- GET `/api/folders` → includes the created folder for owner; admin sees all
- PATCH `/api/folders/[id]` (rename) → 200
- DELETE `/api/folders/[id]` → 200; subsequent GET excludes it

**Auth guards**
- Unauthenticated POST → 401
- USER cannot delete another user's folder → 403

**Form filtering**
- Create a folder and a form in that folder (`folderId`); GET `/api/forms?folderId=[id]` → returns only that form

---

## Step 4 — Form Lifecycle (`tests/form-lifecycle.test.ts`) ✅

### Scenarios

**Form duplication**
- POST `/api/forms/[id]/duplicate` → 200, returns new form with `[COPY]` or similar title prefix
- Duplicated form is owned by the requesting user; original unchanged
- Non-owner (USER2) duplicate → 403; admin duplicate → 200

**Status transitions**
- Create form as draft → PATCH to `status: "published"` → 200
- PATCH to unknown status value → 422

**Cleanup**: Delete all created forms in `afterAll`.

---

## Verification

After implementation, run:

```bash
pnpm test
```

All new test files will be auto-discovered by vitest. Each suite must:
- Pass with no orphaned data (verify by checking `afterAll` cleanup)
- Handle the case where the dev server is not running (tests will fast-fail with connection refused)
- Use `[VITEST]` prefix on any created form/folder titles for easy manual cleanup
