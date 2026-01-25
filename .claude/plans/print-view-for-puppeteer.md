# Puppeteer PDF Print View Implementation Plan

## Overview

Create a dedicated print view accessible by Puppeteer and admin users for PDF generation from form submissions.

## New Files

### 1. `/server/api/print/[token].get.ts`

API endpoint that validates access and returns form+submission data.

**Authentication:**

- Puppeteer: Custom header `X-Puppeteer-Secret` validated against `process.env.PUPPETEER_SECRET`
- Admin users: Session-based via `requireUserSession()` + role check

**Data Fetching:**

- Uses shared `getSubmissionDataByToken(token)` from `/server/utils/submissions.ts`
- Uses shared `getEntrancesByToken(token)` from `/server/utils/submissions.ts`

**Returns:**

- `form`: Form metadata (title, description, theme)
- `elements`: All non-deleted form elements (transformed to BuilderElement format)
- `values`: Merged prefillData + submissionData (keyed by clientId)
- `entrances`: All form entrances for this submission (ordered by timestamp)

### 2. `/app/pages/print/[token].vue`

Page route for print view.

**Features:**

- Fetches data from `/api/print/[token]` (API validates via header on server side)
- Loads form theme CSS (same theme as regular form view)
- Renders `FormPrint` component
- Uses `fill` layout
- Appears identical to regular PC form view on screen
- Includes `@media print` CSS for clean printing (hide scrollbars, adjust margins, handle page breaks)

### 3. `/app/components/form-print/FormPrint.vue`

Read-only form display component.

**Features:**

- Reuses existing `FormField.vue` for rendering elements
- No gates, validation, or submit button
- Displays filled values from `values` prop
- Displays form entrances analytics at the end:
  - Total entrances count
  - Entrance timestamps
  - IP addresses and user agents
- **Styling approach**: Matches the regular PC form view exactly
  - Uses same components and styles as the normal form
  - `@media print` CSS rules for print-specific adjustments only (page breaks, margins, hiding unnecessary elements)
  - Ensures the view looks identical to how users see the form, but prints cleanly

## Modified Files

### `/server/utils/submissions.ts` (New utility file)

Centralize reusable submission and entrance data fetching functions:

**Exported Functions:**

1. `getSubmissionDataByToken(token: string)` - Extract from `generatePDF.ts`
   - Returns submission, form, formElements (filtered for non-deleted)
   - Shared TypeScript interface `SubmissionData`

2. `getEntrancesByToken(token: string)` - Consolidate entrance fetching logic
   - Fetches all form entrances where `sessionToken` matches the submission token
   - Orders by timestamp (chronological order)
   - Returns full entrance records
   - Currently duplicated in: `generatePDF.ts`, `details.get.ts`, `webhookDelivery.ts`

**Usage:**
- Used by PDF generation, print view API, details endpoint, and webhook delivery

### `/server/utils/generatePDF.ts`

Update to use the new shared utility functions:
- Import and use `getSubmissionDataByToken` and `getEntrancesByToken` from `~/server/utils/submissions`
- Remove local `getSubmissionData` function (now shared)
- Remove inline entrances query (now shared)

### `/server/api/submissions/[token]/details.get.ts`

Update to use shared `getEntrancesByToken` function:
- Import and use `getEntrancesByToken` from `~/server/utils/submissions`
- Remove inline entrances query (lines 46-51)

### `/server/utils/webhookDelivery.ts`

Update to use shared `getEntrancesByToken` function:
- Import and use `getEntrancesByToken` from `~/server/utils/submissions`
- Remove inline entrances query (lines 119-128)
- Map to extract only needed fields (id, timestamp, ipAddress, userAgent, referrer)

### `/server/api/submissions/[token]/download-pdf.get.ts`

Update existing PDF endpoint to use new print view URL with header auth:

```typescript
const page = await browser.newPage();
await page.setExtraHTTPHeaders({
  "X-Puppeteer-Secret": process.env.PUPPETEER_SECRET,
});
await page.goto(`${baseUrl}/print/${token}`, { waitUntil: "networkidle0" });
```

## Environment Variable

Add `PUPPETEER_SECRET` to `.env` - a random string for authenticating Puppeteer requests.

## Implementation Order

1. Add `PUPPETEER_SECRET` to `.env.example`
2. Create `/server/utils/submissions.ts` - Extract and export shared functions:
   - `getSubmissionDataByToken(token)` - from generatePDF.ts
   - `getEntrancesByToken(token)` - consolidate from multiple files
3. Refactor existing files to use shared functions:
   - Update `/server/utils/generatePDF.ts`
   - Update `/server/api/submissions/[token]/details.get.ts`
   - Update `/server/utils/webhookDelivery.ts`
4. Create `/server/api/print/[token].get.ts` - Use shared functions
5. Create `/app/components/form-print/FormPrint.vue` - Include entrances display at end
6. Create `/app/pages/print/[token].vue`
7. Update `/server/api/submissions/[token]/download-pdf.get.ts` - Use new print route with Puppeteer

## Verification

1. Test admin access: Login as admin → navigate to `/print/{token}` → form displays with filled values and entrances at end
2. Test Puppeteer access: Request with `X-Puppeteer-Secret` header → form displays correctly
3. Test unauthorized: No header + no session → 401 error
4. Test PDF generation: Call PDF endpoint → generates PDF with correct content including entrances data
5. Test shared functions: Verify `details.get.ts` and `webhookDelivery.ts` still work correctly after refactoring
