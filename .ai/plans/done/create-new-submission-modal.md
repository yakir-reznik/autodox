# Create Submission Modal with Override Settings & Prefill

## Overview
Replace the direct `createNewSubmission()` call with a scrollable modal that lets users:
1. Set **prefill data** for the form's fields
2. Override **form-level settings** (password, webhook URL, webhook include PDF)

## Key Data Points
- **Overrideable settings** (`server/utils/overrideableFormSettings.ts`): `password`, `webhookUrl`, `webhookIncludePdf`
- **Prefill data** uses field `name` as keys (`Record<string, unknown>`)
- **Form elements** fetched from `GET /api/forms/{formId}` (returns elements with type, name, config)
- **`isFieldElement()`** from `useElementDefaults.ts` identifies fillable elements
- Only elements with a non-null `name` can be prefilled
- Skip `signature` and `repeater` types in the prefill UI (too complex for a simple modal)

## Files to Modify

### 1. `app/components/submissions/CreateSubmissionModal.vue` (new)
- Uses `BaseModal` with `v-model` pattern (same as `FormSettingsModal`)
- Size `lg`, content wrapped in `max-h-[60vh] overflow-y-auto` for scrollability
- On open: fetch form with elements from `GET /api/forms/{formId}` to get fields + settings from `GET /api/forms/{formId}/settings`
- Two sections: **Prefill** (field-by-field inputs) and **Settings overrides** (collapsible)
- On submit: POST to `/api/forms/{formId}/create-submission-link` with `prefill` + overrides
- Emits `created` event on success

### 2. `app/pages/submissions/form/[form_id].vue` (modify)
- Add `showCreateModal` ref
- Wire button to open modal instead of calling `createNewSubmission()`
- Remove `createNewSubmission` function and `isCreatingSubmission` ref
- Add `<SubmissionsCreateSubmissionModal>` to template

## Modal Layout

```
┌─ יצירת הגשה חדשה (BaseModal size="lg") ──────┐
│                                                │
│  ┌── scrollable area (max-h-[60vh]) ────────┐  │
│  │                                          │  │
│  │  ── מילוי מוקדם ──────────────────────── │  │
│  │  (For each named field element:)         │  │
│  │                                          │  │
│  │  שם פרטי (text)         [___________]    │  │
│  │  אימייל (email)         [___________]    │  │
│  │  גיל (number)           [___________]    │  │
│  │  עיר (dropdown)         [▾ בחר______]    │  │
│  │  מגדר (radio)           ○ opt1  ○ opt2   │  │
│  │  הסכמה (checkbox)       [✓]              │  │
│  │  תחומים (checkboxes)    ☐ a  ☐ b  ☐ c   │  │
│  │  תאריך (date)           [____-__-__]     │  │
│  │                                          │  │
│  │  (fields without name shown as disabled  │  │
│  │   with "שדה ללא שם" hint — or just       │  │
│  │   filtered out entirely)                 │  │
│  │                                          │  │
│  │  ── הגדרות (collapsible) ─────────────── │  │
│  │  ▸ דריסת הגדרות טופס                    │  │
│  │                                          │  │
│  │  (expanded:)                             │  │
│  │  [ ] דרוס סיסמה     → [password input]  │  │
│  │  [ ] דרוס Webhook   → [url input]       │  │
│  │  [ ] דרוס צירוף PDF → [toggle]          │  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│                   [ביטול]  [צור הגשה]          │
└────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Create `app/components/submissions/CreateSubmissionModal.vue` ✅

**Props & emits:**
- Props: `modelValue: boolean`, `formId: number`, `apiKey: string`
- Emits: `update:modelValue`, `created`

**On open (watch modelValue):**
- Fetch form with elements from `GET /api/forms/{formId}` → extract elements
- Fetch form settings from `GET /api/forms/{formId}/settings` → get current defaults
- Filter elements: `isFieldElement(el.type) && el.name && el.type !== 'signature' && el.type !== 'repeater'`
- Initialize `prefillData` as reactive `Record<string, any>` (empty)
- Initialize override toggles as `false`

**Prefill section:**
- Loop over filtered elements
- Render appropriate input per element type using existing Base components:
  - `text`, `email`, `textarea` → `<BaseInput>` with matching type
  - `number` → `<BaseInput type="number">`
  - `date`, `time`, `datetime` → `<BaseInput>` with `date`/`time`/`datetime-local` type
  - `dropdown` → native `<select>` with element's `config.options`
  - `radio` → radio buttons from `config.options`
  - `checkbox` → `<BaseToggle>`
  - `checkboxes` → checkbox list from `config.options`
- Label each with `config.label` and show element `name` as subtitle hint

**Settings overrides section:**
- Collapsible section (disclosure toggle)
- Three override rows, each with a checkbox toggle + input:
  - Password: checkbox → `<BaseInput type="text">`
  - Webhook URL: checkbox → `<BaseInput type="url" dir="ltr">`
  - Webhook Include PDF: checkbox → `<BaseToggle>`
- Show current form default values as placeholder text

**Submit:**
- Build prefill object: only include keys where value is non-empty
- Build body: `{ prefill, webhook_url?, webhook_include_pdf?, password? }` (only overridden values)
- POST to `/api/forms/{formId}/create-submission-link` with `x-api-key` header
- On success: emit `created`, toast, close
- On error: show error in modal

### Step 2: Update `app/pages/submissions/form/[form_id].vue` ✅
- Add `const showCreateModal = ref(false)`
- Change button `@click` to `showCreateModal = true`
- Remove `createNewSubmission` function and `isCreatingSubmission` ref
- Add to template:
  ```html
  <SubmissionsCreateSubmissionModal
    v-model="showCreateModal"
    :form-id="formId"
    :api-key="user?.apiKey ?? ''"
    @created="refresh"
  />
  ```

## Verification
- Run `pnpm dev` and navigate to a form's submissions page
- Click "צור הגשה חדשה" → modal opens, fields load from form elements
- Fill in some prefill values, leave others empty
- Expand settings overrides, override password
- Click "צור הגשה" → submission created with prefill data + password override
- Verify via submissions table that new submission appears
- Click "צור הגשה חדשה" again with no prefill/overrides → creates clean submission (same as old behavior)
- Cancel → modal closes, no submission created
- Verify modal scrolls when form has many fields
