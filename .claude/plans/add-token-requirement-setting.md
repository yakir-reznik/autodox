# Implementation Plan: Token-Required Form Access Control

## Overview
Add a form-level setting in FormSettingsModal that controls whether a form requires a submission token to be filled. This provides access control: forms can be either publicly accessible or private (token-only).

## Design Decisions

### Field Details
- **Database field**: `requiresToken` (boolean, default `false`)
- **Hebrew label**: "דורש קישור ייעודי" (Requires dedicated link)
- **Help text**: "כאשר מופעל, רק משתמשים עם קישור ייעודי יוכלו למלא את הטופס"
- **Default**: `false` for backward compatibility (existing forms remain publicly accessible)

### Access Control Flow
1. User accesses `/fill/[id]` (no token) → Check if form requires token
2. If `requiresToken: true` and no token → Show 403 error with message
3. If `requiresToken: true` and token provided → Validate token, then check password (if any)
4. If `requiresToken: false` → Allow access (token optional)

### Error Message
**Title**: "נדרש קישור ייעודי"
**Message**: "טופס זה זמין רק באמצעות קישור ייעודי. אנא פנה למנהל המערכת לקבלת הקישור."

## Implementation Steps

### 1. Database Migration
**File**: Create new migration file via `npx drizzle-kit generate`

Add column to forms_table:
```sql
ALTER TABLE `forms_table` ADD `requires_token` boolean DEFAULT false NOT NULL;
```

### 2. Update Schema Definition
**File**: `/Users/yakir_reznik/dev/autodox/server/db/schema.ts` (line ~231)

Add after `password` field:
```typescript
requiresToken: boolean("requires_token").notNull().default(false),
```

### 3. API - Settings GET Endpoint
**File**: `/Users/yakir_reznik/dev/autodox/server/api/forms/[id]/settings.get.ts` (line ~42)

Add to return object:
```typescript
return {
  // ... existing fields
  requiresToken: form.requiresToken,
};
```

### 4. API - Form PATCH Endpoint
**File**: `/Users/yakir_reznik/dev/autodox/server/api/forms/[id].patch.ts` (line 5)

Add to whitelist:
```typescript
const ALLOWED_FIELDS = [
  // ... existing fields
  "requiresToken"
] as const;
```

### 5. API - Form GET Endpoint (Critical Change)
**File**: `/Users/yakir_reznik/dev/autodox/server/api/forms/[id].get.ts` (insert after line 34, BEFORE password check)

Add token validation logic:
```typescript
// Check if form requires token
if (form.requiresToken && !token) {
  throw createError({
    statusCode: 403,
    message: "This form requires a dedicated link to access",
    data: {
      requiresToken: true,
      formTitle: form.title,
    }
  });
}

// If token provided for token-required form, validate it
if (form.requiresToken && token) {
  const submission = await db.query.submissionsTable.findFirst({
    where: eq(submissionsTable.token, token),
  });

  if (!submission || submission.formId !== id) {
    throw createError({
      statusCode: 403,
      message: "Invalid or expired link",
      data: {
        requiresToken: true,
        formTitle: form.title,
      }
    });
  }

  // Check token expiry
  if (new Date() > new Date(submission.expiresAt)) {
    throw createError({
      statusCode: 410,
      message: "Submission link has expired",
    });
  }
}
```

**Important**: This check must happen BEFORE the password check (currently at line 68-85).

### 6. FormSettingsModal - Add State
**File**: `/Users/yakir_reznik/dev/autodox/app/components/form-builder/FormSettingsModal.vue`

**Add reactive ref** (after line 24):
```typescript
const requiresToken = ref(false);
```

**Update fetchSettings** (modify function at line 43-50):
```typescript
const data = await $fetch<{
  // ... existing types
  requiresToken: boolean;
}>(`/api/forms/${props.formId}/settings`);

// ... existing assignments
requiresToken.value = data.requiresToken ?? false;
```

**Update saveSettings** (modify function at line 92-96):
```typescript
await $fetch(`/api/forms/${props.formId}`, {
  method: "PATCH",
  body: {
    password: passwordEnabled.value ? password.value : null,
    requiresToken: requiresToken.value,
  },
});
```

### 7. FormSettingsModal - Add UI Section
**File**: Same file, insert BEFORE password section (around line 127)

```vue
<!-- Token requirement section -->
<div class="space-y-4">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-sm font-medium text-gray-900">דורש קישור ייעודי</h3>
      <p class="text-sm text-gray-500">
        כאשר מופעל, רק משתמשים עם קישור ייעודי יוכלו למלא את הטופס
      </p>
    </div>
    <UiToggle v-model="requiresToken" />
  </div>

  <div v-if="requiresToken" class="rounded-lg bg-blue-50 p-3">
    <p class="text-xs text-blue-700">
      <Icon name="heroicons:information-circle" class="inline h-4 w-4 ml-1" />
      יש ליצור קישורי מילוי ייעודיים עבור משתמשים דרך מסך ניהול השליחות
    </p>
  </div>
</div>

<!-- Divider -->
<div class="border-t border-gray-200"></div>
```

### 8. FormFill - Add Error State
**File**: `/Users/yakir_reznik/dev/autodox/app/components/form-fill/FormFill.vue`

Insert after password gate block (around line 341):
```vue
<!-- Token required error -->
<div v-else-if="error?.statusCode === 403 && error?.data?.requiresToken"
     class="grid place-items-center min-h-screen">
  <div class="form-fill-error-state form-fill-card">
    <Icon name="heroicons:link-slash" class="mx-auto h-12 w-12 text-orange-500" />
    <h2 class="form-fill-error-title">נדרש קישור ייעודי</h2>
    <p class="form-fill-error-message">
      טופס זה זמין רק באמצעות קישור ייעודי. אנא פנה למנהל המערכת לקבלת הקישור.
    </p>
    <p v-if="error?.data?.formTitle" class="text-sm text-gray-500 mt-2">
      טופס: {{ error.data.formTitle }}
    </p>
  </div>
</div>
```

## Edge Cases Handled

1. **Token provided for public form** → Works normally (backward compatible)
2. **Form requires token AND password** → Token check first, then password gate
3. **Invalid token on token-required form** → 403 error with clear message
4. **Expired token** → 410 error (already handled)
5. **Toggle requiresToken ON for existing form** → Immediate effect (public access blocked)

## Testing Checklist

### API Tests
- [ ] GET form with `requiresToken: true`, no token → 403
- [ ] GET form with `requiresToken: true`, valid token → Success
- [ ] GET form with `requiresToken: true`, invalid token → 403
- [ ] GET form with `requiresToken: false`, no token → Success
- [ ] PATCH form to update `requiresToken` → Success
- [ ] GET settings returns `requiresToken` → Success

### UI Tests
- [ ] Open FormSettingsModal → toggle appears
- [ ] Toggle ON → info box appears
- [ ] Save settings → API called correctly
- [ ] Access form without token when required → error shown
- [ ] Access form with token when required → form loads

### Edge Cases
- [ ] Form with token requirement AND password → both checks work
- [ ] Expired token on token-required form → proper error

## Critical Files

1. `/Users/yakir_reznik/dev/autodox/server/db/schema.ts` - Add field definition
2. `/Users/yakir_reznik/dev/autodox/server/api/forms/[id].get.ts` - Core access control logic
3. `/Users/yakir_reznik/dev/autodox/app/components/form-builder/FormSettingsModal.vue` - Settings UI
4. `/Users/yakir_reznik/dev/autodox/server/api/forms/[id]/settings.get.ts` - Return requiresToken
5. `/Users/yakir_reznik/dev/autodox/server/api/forms/[id].patch.ts` - Allow updating field
6. `/Users/yakir_reznik/dev/autodox/app/components/form-fill/FormFill.vue` - Error state

## Migration Impact
- ✅ Zero breaking changes (default `false` maintains current behavior)
- ✅ All existing forms remain publicly accessible
- ✅ Existing submission tokens continue to work
