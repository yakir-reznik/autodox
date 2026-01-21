# Password-Protected Forms & Submission Links

## Overview
Add password protection at two levels:
1. **Form-level**: Define a form as password protected (all submission links require password)
2. **Submission-level**: Pass password when creating a submission link (overrides/adds protection for that single link)

**Priority rule**: Submission-specific password > Form password > No protection

---

## Database Changes

### 1. Add to `submissionsTable` (server/db/schema.ts)
```typescript
passwordHash: varchar("password_hash", { length: 255 }), // null = no submission-specific password
```

### 2. Add to `formsTable` (server/db/schema.ts)
```typescript
passwordHash: varchar("password_hash", { length: 255 }), // null = no form-level password
```

**Migration required**: Run `npx drizzle-kit generate` then `npx drizzle-kit migrate`

---

## API Changes

### 1. Update `create-submission-link.post.ts`
- Accept optional `password` field in request body
- Hash password using existing scrypt pattern before storing
- File: `/server/api/forms/[id]/create-submission-link.post.ts`

### 2. Update `[id].get.ts` (form fetch)
- Check if password is required (form or submission has passwordHash)
- If password required, return limited response: `{ requiresPassword: true, formId, title }`
- Only return full form data after password verification
- File: `/server/api/forms/[id].get.ts`

### 3. Create new endpoint: `POST /api/forms/[id]/verify-password`
- Accepts: `{ token?: string, password: string }`
- Verifies password against submission-specific hash OR form hash
- On success: Mark submission as verified (add `passwordVerified` boolean to submissions)
- Returns: `{ success: true }` or 401 error
- File: `/server/api/forms/[id]/verify-password.post.ts`

### 4. Update form PATCH endpoint
- Allow setting/removing form password via PATCH
- File: `/server/api/forms/[id].patch.ts`

---

## Frontend Changes

### 1. Create `FormSettingsModal.vue` component
- Modal with form settings including password protection
- Toggle to enable/disable password protection
- Password input field (shown when enabled)
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

## Password Hashing (reuse existing pattern)
From `server/api/auth/login.post.ts`:
```typescript
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  const hashBuffer = Buffer.from(hash, "hex");
  const suppliedHashBuffer = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(hashBuffer, suppliedHashBuffer);
}
```

Create utility file: `/server/utils/password.ts`

---

## Implementation Order

1. Create password utility (`server/utils/password.ts`)
2. Update database schema (add passwordHash fields)
3. Run database migration (user will do this)
4. Update `create-submission-link.post.ts` (accept password param)
5. Create `verify-password.post.ts` endpoint
6. Update `[id].get.ts` (check password protection)
7. Update `[id].patch.ts` (allow setting form password)
8. Create `PasswordGate.vue` component
9. Update `FormFill.vue` (integrate password gate)
10. Create `FormSettingsModal.vue` component
11. Update `FormHeader.vue` (add settings button)

---

## Critical Files

| File | Change |
|------|--------|
| `server/db/schema.ts` | Add passwordHash to forms & submissions |
| `server/utils/password.ts` | New - hash/verify utilities |
| `server/api/forms/[id]/create-submission-link.post.ts` | Accept password param |
| `server/api/forms/[id]/verify-password.post.ts` | New - password verification |
| `server/api/forms/[id].get.ts` | Check password protection |
| `server/api/forms/[id].patch.ts` | Allow setting form password |
| `app/components/form-fill/PasswordGate.vue` | New - password entry UI |
| `app/components/form-fill/FormFill.vue` | Integrate password gate |
| `app/components/form-builder/FormSettingsModal.vue` | New - form settings modal |
| `app/components/form-builder/FormHeader.vue` | Add settings button |

---

## Verification

1. **Test submission-level password**:
   - Create submission link with password via API
   - Access link in browser - should show password prompt
   - Enter wrong password - should show error
   - Enter correct password - should show form

2. **Test form-level password via UI**:
   - Open form in builder
   - Click settings button → enable password → save
   - Create submission link (no password param)
   - Access link - should require form password

3. **Test priority** (submission > form):
   - Form has password "form123"
   - Create link with password "link456"
   - Only "link456" should work for that specific link

4. **Test removing password**:
   - Form has password set
   - Open settings modal → disable password → save
   - Create new submission link
   - Access link - should NOT require password
