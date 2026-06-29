# Implementation Plan: Public Form Submissions Setting

## Overview

Add a form-level setting in FormSettingsModal that controls whether a form allows public submissions (anyone can fill and submit) or requires a pre-created submission link (token required). For public forms, automatically generate a unique token on submission and track these as "public" submissions.

## User-Facing Phrasing (Hebrew)

**Setting Label**: "גישה לטופס" (Form Access)

**Options**:

1. **"פתוח לכולם"** (Open to everyone) - Default
   - Help text: "כל מי שיש לו את כתובת הטופס יכול למלא ולשלוח"
   - (Anyone with the form URL can fill and submit)

2. **"קישור אישי בלבד"** (Personal link only)
   - Help text: "רק משתמשים עם קישור ייעודי יוכלו למלא את הטופס"
   - (Only users with a dedicated link can fill the form)

**Submissions list indicator**: For public submissions, show a badge "הגשה ציבורית" (Public submission) or a globe icon to distinguish from admin-created submission links.

## Design Decisions

### Database Changes

**1. forms_table - New column:**

```sql
`allow_public_submissions` boolean DEFAULT true NOT NULL
```

- Default `true` for backward compatibility (existing forms remain accessible)

**2. submissions_table - New column:**

```sql
`is_public` boolean DEFAULT false NOT NULL
```

- Indicates if submission was auto-created (public) vs admin-created (via API)
- Public submissions have `createdByUserId` = NULL and `isPublic` = TRUE

### Access Flow

**Current flow (with token):**

1. Admin creates submission link → token generated
2. User accesses `/fill/{id}?token=xxx` → submission tracked
3. User submits → updates existing submission record

**New flow (public submissions):**

1. Form has `allowPublicSubmissions: true`
2. User accesses `/fill/{id}` (no token) → form loads normally
3. User submits → NEW submission record auto-created with:
   - Auto-generated token
   - `isPublic: true`
   - `createdByUserId: null`
   - `status: locked` (immediately submitted)
4. Return success

**Blocked flow (requires link):**

1. Form has `allowPublicSubmissions: false`
2. User accesses `/fill/{id}` (no token) → form loads normally (can view)
3. User tries to submit → error message explaining they need a dedicated link

## Implementation Steps

### 1. Database Migration ✅

**File**: New migration via `npx drizzle-kit generate`

```sql
ALTER TABLE `forms_table` ADD `allow_public_submissions` boolean DEFAULT true NOT NULL;
ALTER TABLE `submissions_table` ADD `is_public` boolean DEFAULT false NOT NULL;
```

### 2. Update Schema Definition ✅

**File**: `server/db/schema.ts`

Add to `formsTable` (after line 231 - after `password`):

```typescript
allowPublicSubmissions: boolean("allow_public_submissions").notNull().default(true),
```

Add to `submissionsTable` (after line 323 - after `status`):

```typescript
isPublic: boolean("is_public").notNull().default(false),
```

### 3. API - Settings GET Endpoint ✅

**File**: `server/api/forms/[id]/settings.get.ts`

Add to return object:

```typescript
return {
  // ... existing fields
  allowPublicSubmissions: form.allowPublicSubmissions,
};
```

### 4. API - Form PATCH Endpoint ✅

**File**: `server/api/forms/[id].patch.ts`

Add to allowed fields:

```typescript
const ALLOWED_FIELDS = [
  // ... existing fields
  "allowPublicSubmissions",
] as const;
```

### 5. API - Form GET Endpoint

**File**: `server/api/forms/[id].get.ts`

Return `allowPublicSubmissions` in the response so the client knows if public submission is allowed.

### 6. API - Unified Form Submit Endpoint ✅

**File**: `server/api/forms/[id]/submit.post.ts` (NEW FILE)

This endpoint handles both token-based and public submissions:

- **With token in body**: Updates existing submission (same as legacy flow)
- **Without token**: Checks `allowPublicSubmissions` and creates a new public submission

Key logic:

1. If `token` provided → find submission, validate, update with `submissionData`, lock it
2. If no `token` → check `form.allowPublicSubmissions`, if true create new submission with `isPublic: true`
3. Returns 403 error if public submissions not allowed and no token provided

### 7. FormFill.vue - Update Submit Logic ✅

**File**: `app/components/form-fill/FormFill.vue`

Update `handleSubmit()` function to use the unified endpoint:

```typescript
async function handleSubmit() {
  if (!validateAll()) return;

  isSubmitting.value = true;

  try {
    // Convert formData to use element names instead of clientIds
    const submissionData: Record<string, any> = {};
    Object.entries(formData).forEach(([clientId, value]) => {
      const element = allElements.value.find((el) => el.clientId === clientId);
      if (element && isFieldElement(element.type)) {
        const key = element.name || clientId;
        submissionData[key] = value;
      }
    });

    // Use unified endpoint - pass token if available
    await $fetch(`/api/forms/${props.formId}/submit`, {
      method: "POST",
      body: { submissionData, token: props.token },
    });

    isSubmitted.value = true;
  } catch (error: any) {
    console.error("Submission error:", error);
    // Handle 403 for "requires link" error
    if (error?.statusCode === 403) {
      alert(error?.data?.message || "טופס זה דורש קישור אישי לשליחה");
    } else {
      alert(error?.data?.message || "שליחת הטופס נכשלה. אנא נסה שוב.");
    }
  } finally {
    isSubmitting.value = false;
  }
}
```

**IMPORTANT**: Remove the early return check for missing token (delete the block that checks `if (!props.token)` and returns early).

### 8. FormSettingsModal - Add State & UI ✅

**File**: `app/components/form-builder/FormSettingsModal.vue`

**Add reactive ref** (after line 25):

```typescript
const allowPublicSubmissions = ref(true);
```

**Update fetchSettings** (line 43-50):

```typescript
const data = await $fetch<{
  id: number;
  title: string;
  password: string | null;
  allowPublicSubmissions: boolean;
}>(`/api/forms/${props.formId}/settings`);

passwordEnabled.value = !!data.password;
password.value = data.password ?? "";
allowPublicSubmissions.value = data.allowPublicSubmissions ?? true;
```

**Update saveSettings** (line 92-96):

```typescript
await $fetch(`/api/forms/${props.formId}`, {
  method: "PATCH",
  body: {
    password: passwordEnabled.value ? password.value : null,
    allowPublicSubmissions: allowPublicSubmissions.value,
  },
});
```

**Add UI section** (insert BEFORE password section, around line 127):

```vue
<!-- Form access section -->
<div class="space-y-4">
  <div>
    <h3 class="text-sm font-medium text-gray-900">גישה לטופס</h3>
    <p class="text-sm text-gray-500 mt-1">
      בחר מי יכול למלא ולשלוח את הטופס
    </p>
  </div>

  <div class="space-y-3">
    <label class="flex items-start gap-3 cursor-pointer">
      <input
        type="radio"
        :checked="allowPublicSubmissions"
        @change="allowPublicSubmissions = true"
        class="mt-1"
      />
      <div>
        <span class="text-sm font-medium text-gray-900">פתוח לכולם</span>
        <p class="text-xs text-gray-500">
          כל מי שיש לו את כתובת הטופס יכול למלא ולשלוח
        </p>
      </div>
    </label>

    <label class="flex items-start gap-3 cursor-pointer">
      <input
        type="radio"
        :checked="!allowPublicSubmissions"
        @change="allowPublicSubmissions = false"
        class="mt-1"
      />
      <div>
        <span class="text-sm font-medium text-gray-900">קישור אישי בלבד</span>
        <p class="text-xs text-gray-500">
          רק משתמשים עם קישור ייעודי יוכלו למלא את הטופס
        </p>
      </div>
    </label>
  </div>
</div>

<!-- Divider -->
<div class="border-t border-gray-200"></div>
```

### 9. Submissions List - Show Public Indicator ✅

**File**: `app/pages/submissions/[form_id].vue`

Update `Submission` interface (add after line 11):

```typescript
isPublic: boolean;
```

Update the status column in the table (around line 445) to include a public indicator:

```vue
<td class="px-6 py-4 text-sm whitespace-nowrap">
  <div class="flex items-center gap-2">
    <span
      class="rounded-full px-2.5 py-0.5 text-xs font-medium"
      :class="statusColors[submission.status]"
    >
      {{ statusLabels[submission.status] }}
    </span>
    <span
      v-if="submission.isPublic"
      class="rounded-full bg-purple-100 text-purple-800 px-2 py-0.5 text-xs font-medium flex items-center gap-1"
      title="הגשה ציבורית"
    >
      <Icon name="heroicons:globe-alt" class="h-3 w-3" />
      ציבורי
    </span>
  </div>
</td>
```

### 10. API - Submissions List Endpoint ✅

**File**: `server/api/forms/[id]/submissions.get.ts`

Ensure `isPublic` is included in the select query and returned in the response.

## Critical Files

1. `server/db/schema.ts` - Add `allowPublicSubmissions` to forms, `isPublic` to submissions
2. `server/api/forms/[id]/submit.post.ts` - **NEW**: Unified submit endpoint (token + public)
3. `app/components/form-fill/FormFill.vue` - Update submit logic to use unified endpoint
4. `app/components/form-builder/FormSettingsModal.vue` - Add form access setting UI
5. `app/pages/submissions/[form_id].vue` - Show public submission indicator
6. `server/api/forms/[id]/settings.get.ts` - Return `allowPublicSubmissions`
7. `server/api/forms/[id].patch.ts` - Allow updating `allowPublicSubmissions`
8. `server/api/forms/[id].get.ts` - Return `allowPublicSubmissions` for client
9. `server/api/forms/[id]/submissions.get.ts` - Include `isPublic` in response

## Edge Cases

1. **Form with `allowPublicSubmissions: false` and no token** → User can view form but submission returns 403 with clear message
2. **Form with both public access AND password** → Password checked before form loads, then public submission works
3. **Toggle setting OFF for existing form** → New public submissions blocked, existing tokens still work
4. **Public submission on unpublished form** → Rejected (form must be published)

## Testing Checklist

### API Tests

- [ ] GET form returns `allowPublicSubmissions`
- [ ] PATCH form updates `allowPublicSubmissions`
- [ ] GET settings returns `allowPublicSubmissions`
- [ ] POST public-submit with `allowPublicSubmissions: true` → Success, creates submission with `isPublic: true`
- [ ] POST public-submit with `allowPublicSubmissions: false` → 403 error
- [ ] GET submissions returns `isPublic` field

### UI Tests

- [ ] FormSettingsModal shows access radio buttons
- [ ] Default is "Open to everyone" (true)
- [ ] Selecting "Personal link only" saves correctly
- [ ] FormFill submits without token when allowed → success screen
- [ ] FormFill shows error alert when public submission blocked
- [ ] Submissions list shows "ציבורי" badge for public submissions

### End-to-End

- [ ] Create form → set to "Personal link only" → try to submit without token → see error alert
- [ ] Create form → leave as "Open to everyone" → submit without token → success
- [ ] Check submissions list shows the public submission with purple "ציבורי" badge

## Migration Impact

- ✅ Default `allowPublicSubmissions: true` maintains current accessibility
- ✅ Default `isPublic: false` correctly marks existing submissions as admin-created
- ✅ No breaking changes to existing token-based flows
