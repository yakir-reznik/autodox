# Test Suite Documentation

## Prerequisites

Three long-lived test users must exist in the DB:

| Email | Password | Role |
|---|---|---|
| `vitest-admin@autodox.test` | `vitest123` | `admin` |
| `vitest-user@autodox.test` | `vitest123` | `user` |
| `vitest-user2@autodox.test` | `vitest123` | `user` |

Create them:
```bash
npx tsx scripts/create-admin.ts vitest-admin@autodox.test vitest123 "Vitest Admin"
npx tsx scripts/create-admin.ts vitest-user@autodox.test vitest123 "Vitest User"
npx tsx scripts/create-admin.ts vitest-user2@autodox.test vitest123 "Vitest User 2"
```
```sql
UPDATE users_table SET role='user' WHERE email IN ('vitest-user@autodox.test', 'vitest-user2@autodox.test');
```

## Running

Requires the dev server running at `http://localhost:3000` (override with `TEST_BASE_URL`).

```bash
pnpm test          # single run
pnpm test:watch    # watch mode
```

## Data

Tests create real forms in the dev DB — all titles are prefixed `[VITEST]`. They are deleted in `afterAll` via the admin account. If a run crashes before cleanup, remove orphans with:

```sql
DELETE FROM forms_table WHERE title LIKE '[VITEST]%';
```

Some tests also `PATCH` form titles in-place, but those forms are still cleaned up at the end.

## What each file tests

### `auth.test.ts`
- Admin login → `roles: ["admin", "user"]`; user login → `roles: ["user"]`
- Session shape includes id, email, apiKey
- Wrong credentials → 401
- Unauthenticated session has no `user` key; health endpoint is public

### `authorization.test.ts`
- Six protected endpoints → 401 without a session
- Admin-only endpoints → 200 for admin, 403 for user
- User-or-admin endpoints → 200 for both roles; 401 without session

### `forms.test.ts`
- Create: user and admin can create; unauthenticated cannot (401)
- List: user sees only own forms; admin sees all; rows include `isOwner` and `permissions`
- Get: owner gets form with full permissions object; non-owner/non-grantee → 403
- Patch: owner can patch; user cannot patch another's form (403); admin can patch any
- Delete: owner can delete; user cannot delete another's (403); admin can delete any; deleted form → 404

### `form-sharing.test.ts`
- **Share CRUD**: owner creates, lists, updates, and deletes shares
- **Validation**: duplicate share → 409; share with self → 400; non-owner managing shares → 403; unauthenticated → 401
- **Grantee enforcement**: shared form appears in grantee's list with correct permissions; without `edit_form` → PATCH 403; after upgrade → PATCH 200; delete and manage-shares always 403 for grantee
- **Revocation**: after share deleted, form disappears from grantee's list and GET → 403
- **Admin bypass**: admin can GET, PATCH, and list shares on any form without a share record
