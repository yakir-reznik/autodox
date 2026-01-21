# Password-Protected Forms & Submission Links

## Overview
Add password protection at two levels:
1. **Form-level**: Define a form as password protected (all submission links require password)
2. **Submission-level**: Pass password when creating a submission link (overrides/adds protection for that single link)

**Priority rule**: Submission-specific password > Form password > No protection

**Important UX requirement**: Password is stored as **plain text** (not hashed) and displayed directly in the form builder settings. This allows form creators to see and edit the current password.

**Security model**:
- `GET /api/forms/[id]` (public) returns only `hasPassword: boolean` - never the actual password
- `GET /api/forms/[id]/settings` (auth required) returns full settings including plain text password
- Form fill page only knows IF password is required, not what it is

---

## Database Changes ✅ COMPLETED

### 1. Update `formsTable` (server/db/schema.ts) ✅
```typescript
password: varchar("password", { length: 255 }), // null = no form-level password, stored as plain text
```

### 2. Update `submissionsTable` (server/db/schema.ts) ✅
```typescript
password: varchar("password", { length: 255 }), // null = no submission-specific password, stored as plain text
```

**Migration**: Run `npx drizzle-kit generate` then `npx drizzle-kit migrate`

---

## API Changes

### 1. Update `create-submission-link.post.ts`
- Accept optional `password` field in request body
- Store password as plain text
- File: `/server/api/forms/[id]/create-submission-link.post.ts`

### 2. Update `[id].get.ts` (form fetch - public)
- **NEVER return the actual password**
- Return `hasPassword: boolean` indicating if password protection is enabled (form or submission level)
- If password required AND not yet verified, return limited response: `{ hasPassword: true, formId, title }`
- Only return full form data after password verification
- File: `/server/api/forms/[id].get.ts`

### 3. Create new endpoint: `GET /api/forms/[id]/settings` (auth required)
- Returns form settings including plain text password
- Only accessible to authenticated users (form creators/admins)
- Used by form builder to display current password
- File: `/server/api/forms/[id]/settings.get.ts`

### 4. Create new endpoint: `POST /api/forms/[id]/verify-password`
- Accepts: `{ token?: string, password: string }`
- Compares password against submission-specific password OR form password (plain text comparison)
- On success: Mark session as verified (could use cookie/session or mark submission record)
- Returns: `{ success: true }` or 401 error
- File: `/server/api/forms/[id]/verify-password.post.ts`

### 5. Update form PATCH endpoint
- Allow setting/removing form password via PATCH
- File: `/server/api/forms/[id].patch.ts`

---

## Frontend Changes

### 1. Create `FormSettingsModal.vue` component
- Modal with form settings including password protection
- Fetch current settings from `GET /api/forms/[id]/settings` (includes plain text password)
- Toggle to enable/disable password protection
- **Plain text input** (shown when toggle is on) - regular text input, NOT password type
- Display current password in the input field (fetched from settings endpoint)
- **Validation**: Password field cannot be empty when toggle is enabled
- Toggle off = remove password protection (set password to null)
- Save button to update form via PATCH
- File: `/app/components/form-builder/FormSettingsModal.vue`

### 2. Update `FormHeader.vue` or `FormBuilder.vue`
- Add settings icon/button to open the settings modal
- File: `/app/components/form-builder/FormHeader.vue`

### 3. Create `PasswordGate.vue` component
- Simple password entry form with Hebrew RTL support
- Shows form title so user knows which form
- Emits `verified` event on successful password entry
- File: `/app/components/form-fill/PasswordGate.vue`

### 4. Update `FormFill.vue`
- Handle `requiresPassword: true` response from API
- Show PasswordGate component when password required
- After verification, refresh form data and show actual form
- File: `/app/components/form-fill/FormFill.vue`

### 5. Update fill page `[form_id].vue`
- Handle password-protected response type
- File: `/app/pages/fill/[form_id].vue`

---

## Password Storage (Plain Text)

Passwords are stored as plain text for simplicity and to allow display in the form builder.

**Security considerations**:
- Form passwords are simple access control, not high-security credentials
- If DB is compromised, attacker could remove password anyway
- Trade-off: usability (editable passwords) vs security (hashed passwords)

**No utility file needed** - just simple string comparison for verification.

---

## Implementation Order

1. ~~Update database schema (rename `passwordHash` → `password` in both tables)~~ ✅
2. Run database migration (user will do this)
3. Create `settings.get.ts` endpoint (auth required, returns password)
4. Update `[id].get.ts` (return `hasPassword` boolean, never actual password)
5. Update `[id].patch.ts` (allow setting/removing form password)
6. Create `verify-password.post.ts` endpoint
7. Update `create-submission-link.post.ts` (accept password param)
8. Create `PasswordGate.vue` component
9. Update `FormFill.vue` (integrate password gate)
10. Create `FormSettingsModal.vue` component
11. Update `FormHeader.vue` (add settings button)

---

## Critical Files

| File | Change |
|------|--------|
| `server/db/schema.ts` | Rename `passwordHash` → `password` in forms & submissions |
| `server/api/forms/[id]/settings.get.ts` | New - auth required, returns plain text password |
| `server/api/forms/[id]/create-submission-link.post.ts` | Accept password param |
| `server/api/forms/[id]/verify-password.post.ts` | New - password verification (plain text compare) |
| `server/api/forms/[id].get.ts` | Return `hasPassword` boolean, never actual password |
| `server/api/forms/[id].patch.ts` | Allow setting/removing form password |
| `app/components/form-fill/PasswordGate.vue` | New - password entry UI |
| `app/components/form-fill/FormFill.vue` | Integrate password gate |
| `app/components/form-builder/FormSettingsModal.vue` | New - form settings modal with plain text password input |
| `app/components/form-builder/FormHeader.vue` | Add settings button |

---

## Verification

1. **Test form builder settings**:
   - Open form in builder → click settings
   - Enable password toggle → password input should appear (required, cannot be empty)
   - Enter password → save → reload page
   - Open settings again → password should be visible in plain text

2. **Test submission-level password**:
   - Create submission link with password via API
   - Access link in browser - should show password prompt
   - Enter wrong password - should show error
   - Enter correct password - should show form

3. **Test form-level password via UI**:
   - Open form in builder
   - Click settings button → enable password → enter password → save
   - Create submission link (no password param)
   - Access link - should require form password

4. **Test priority** (submission > form):
   - Form has password "form123"
   - Create link with password "link456"
   - Only "link456" should work for that specific link

5. **Test removing password**:
   - Form has password set
   - Open settings modal → disable toggle → save
   - Create new submission link
   - Access link - should NOT require password

6. **Test security** (password not leaked):
   - Access `/api/forms/[id]` directly - should NOT contain password field
   - Access `/api/forms/[id]/settings` without auth - should return 401
