# User Profile Page

## Migration SQL (operator must run before implementation)

```sql
ALTER TABLE users_table
  ADD COLUMN google_id VARCHAR(255) DEFAULT NULL,
  ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN last_login_at TIMESTAMP DEFAULT NULL;
```

## Steps

### Step 1: Update DB schema + extract password utils

**Files to modify:**
- `server/db/schema.ts` — add `googleId`, `createdAt`, `lastLoginAt` to `usersTable`

**Files to create:**
- `server/utils/password.ts` — extract `hashPassword()` and `verifyPassword()` from login/signup (scrypt-based). Nuxt auto-imports server utils.

**Files to refactor:**
- `server/api/auth/login.post.ts` — use shared `verifyPassword()`, add `lastLoginAt` update after successful login
- `server/api/auth/signup.post.ts` — use shared `hashPassword()`

---

### Step 2: Update Google OAuth handler

**File:** `server/routes/auth/google.get.ts`

- On new user creation: store `googleId: user.sub`
- On existing user login: update `lastLoginAt` to now, set `googleId` if not already set

---

### Step 3: Create user profile API endpoints

All new files under `server/api/user/`:

| File | Method | Purpose |
|------|--------|---------|
| `profile.get.ts` | GET | Return user data + formCount + submissionCount (join forms+submissions). Exclude password hash, return `hasPassword: boolean` and `googleId` |
| `profile.patch.ts` | PATCH | Update display name. Update session so client reflects change |
| `change-password.post.ts` | POST | Verify current password (skip if OAuth-only user setting first password), hash new password, save. Min 6 chars |
| `reroll-api-key.post.ts` | POST | Generate `randomBytes(32).toString("hex")` (64 chars), save, update session |
| `disconnect-google.post.ts` | POST | Set `googleId` to null. Block if user has no password (would be locked out) |

---

### Step 4: Create global submissions endpoint

**File:** `server/api/user/submissions.get.ts`

- Join `submissions_table` with `forms_table` on `formId`, filter by `forms_table.createdBy = userId`
- Select submission fields + `formTitle`, `formId`
- Paginated (page/limit query params), ordered by `createdAt DESC`
- Same response shape as existing per-form submissions endpoint: `{ data, pagination }`

---

### Step 5: Build user profile page

**File:** `app/pages/user/index.vue`

Card-based layout with RTL, Tailwind, same patterns as `forms/index.vue`.

**Sections:**
1. **Header** — back link to `/forms`, title "פרופיל משתמש", logout button
2. **Account Info card** — email (read-only), name (inline edit with pencil icon), signup date, last login
3. **Statistics card** — form count (links to `/forms`), submission count (links to `/user/submissions`)
4. **Security card** — change password button (opens modal), API key (show/hide, copy, re-roll with confirmation modal)
5. **Connected Accounts card** — Google connection status. If connected: show "מחובר" + disconnect button (disabled if no password). If not: link to `/auth/google`

**Modals (using BaseModal):**
- Change password: current password input (hidden if `!hasPassword`), new password input, error display
- Re-roll API key: confirmation warning, confirm/cancel

**Data fetching:** `useFetch<ProfileData>("/api/user/profile")` for all data. Mutations via `$fetch` with POST/PATCH. Toast feedback via `useToasts().add()`.

---

### Step 6: Build global submissions page

**File:** `app/pages/user/submissions.vue`

Based closely on `app/pages/submissions/[form_id].vue` pattern with these differences:
- Fetches from `/api/user/submissions` (no formId)
- Table has extra "Form" column showing `formTitle` as link to `/submissions/${formId}`
- Header says "כל ההגשות", back link goes to `/user`
- No "Create Submission" button
- Same pagination, status colors/labels, date formatting, PDF download, view details actions

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `server/db/schema.ts` |
| Create | `server/utils/password.ts` |
| Modify | `server/api/auth/login.post.ts` |
| Modify | `server/api/auth/signup.post.ts` |
| Modify | `server/routes/auth/google.get.ts` |
| Create | `server/api/user/profile.get.ts` |
| Create | `server/api/user/profile.patch.ts` |
| Create | `server/api/user/change-password.post.ts` |
| Create | `server/api/user/reroll-api-key.post.ts` |
| Create | `server/api/user/disconnect-google.post.ts` |
| Create | `server/api/user/submissions.get.ts` |
| Modify | `app/pages/user/index.vue` |
| Create | `app/pages/user/submissions.vue` |

## Verification

1. Run migration SQL on database
2. `pnpm dev` — verify no TypeScript errors
3. Log in with email/password — check `lastLoginAt` updates
4. Log in with Google — check `googleId` and `lastLoginAt` set
5. Visit `/user` — verify all profile data loads
6. Test: edit name, change password, view/copy/re-roll API key
7. Test: Google disconnect (should block if no password)
8. Visit `/user/submissions` — verify global submissions list with pagination
