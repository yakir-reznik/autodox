# Puppeteer PDF Print View Implementation Plan

## Overview

Create a dedicated print view accessible by Puppeteer and admin users for PDF generation from form submissions.

## New Files

### 1. `/app/types/submission-timeline.ts`

TypeScript type definitions for submission timeline events.

**Exported Types:**

- `BaseSubmissionTimelineEvent` - Base interface with timestamp and type discriminator
- `SubmissionLifecycleEvent` - Lifecycle events (created, started, submitted, locked, expires) with event name and optional status
- `SubmissionEntranceEvent` - Entrance events with id, ipAddress, userAgent, referrer, isFormLocked
- `SubmissionWebhookEvent` - Webhook delivery events with id, webhookUrl, status, httpStatusCode, errorMessage, retryCount, deliveredAt
- `SubmissionTimelineEvent` - Union type of all timeline event types

### 2. `/app/pages/print/[token].vue`

Page route for print view.

**Features:**

- Fetches data from `/api/submissions/[token]/details?include=all`
  - Note: When accessed by Puppeteer, the page doesn't need to add the header - Puppeteer sets it at the browser level via `setExtraHTTPHeaders`
  - When accessed by admin users in browser, uses session authentication
- Loads form theme CSS (same theme as regular form view)
- Renders `FormPrint` component with form data and submissionTimeline
- Uses `fill` layout
- Appears identical to regular PC form view on screen
- Includes `@media print` CSS for clean printing (hide scrollbars, adjust margins, handle page breaks)

### 3. `/app/components/form-print/FormPrint.vue`

Read-only form display component.

**Props:**

- `form`: Form metadata
- `elements`: Form elements to display
- `values`: Filled submission values
- `submissionTimeline`: Complete submission timeline

**Features:**

- Reuses existing `FormField.vue` for rendering elements
- No gates, validation, or submit button
- Displays filled values from `values` prop
- Displays **complete submission timeline** at the end:
  - Lifecycle events (created, started, submitted, locked, expires)
  - Submission entrance events (timestamp, IP, user agent, referrer, locked status)
  - Webhook deliveries (delivery attempts, status, error messages)
  - All events sorted chronologically with clear event type labels
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

2. `getSubmissionEntrancesByToken(token: string)` - Consolidate submission entrance fetching logic
   - Fetches all form entrances where `sessionToken` matches the submission token
   - Orders by timestamp (chronological order)
   - Returns full entrance records
   - Currently duplicated in: `generatePDF.ts`, `details.get.ts`, `webhookDelivery.ts`

3. `getSubmissionTimeline(token: string)` - **NEW** comprehensive timeline function
   - Combines multiple data sources into a chronological timeline
   - Returns unified array of timeline events with:
     - **Lifecycle events**: created, started, submitted, locked, expires (from submission record)
     - **Submission entrance events**: timestamp, IP address, user agent, referrer, locked status
     - **Webhook deliveries**: delivery attempts, status, timestamps, error messages
   - All events include a `type` field for easy rendering (e.g., "lifecycle", "entrance", "webhook")
   - Sorted chronologically by timestamp
   - **Return type**: `SubmissionTimelineEvent[]` imported from `~/app/types/submission-timeline`
   - Uses type guards to properly type each event

**Exported TypeScript Interfaces:**

- `SubmissionData` - Submission with form and formElements

**Imported Types:**

- `SubmissionTimelineEvent`, `SubmissionLifecycleEvent`, `SubmissionEntranceEvent`, `SubmissionWebhookEvent` from `~/app/types/submission-timeline`

**Usage:**

- Used by PDF generation, print view API, details endpoint, and webhook delivery

### `/server/utils/generatePDF.ts`

Update to use the new shared utility functions:

- Import and use `getSubmissionDataByToken` and `getSubmissionEntrancesByToken` from `~/server/utils/submissions`
- Remove local `getSubmissionData` function (now shared)
- Remove inline entrances query (now shared)
- Note: Can optionally use `getSubmissionTimeline` for webhook data, but current inline timeline building is acceptable for PDF-specific formatting needs

### `/server/api/submissions/[token]/details.get.ts`

**Major Refinement** - Transform into flexible data API with query parameters:

**Authentication (Enhanced - Either/Or):**

- **Option 1 - Puppeteer**: Custom header `X-Puppeteer-Secret` validated against `process.env.PUPPETEER_SECRET`
- **Option 2 - Browser**: Session-based via `requireUserSession()` cookie + admin role check
- Authentication flow: Check for Puppeteer header first, if not present, fallback to session authentication

**Query Parameters:**

- `include`: Comma-separated list of data to return
  - Options: `form`, `elements`, `submissionEntrances`, `submissionTimeline`, `webhooks`, `all`
  - Default: `all` (returns everything)
  - Examples:
    - `?include=form,submissionTimeline` - Only form metadata and timeline
    - `?include=all` - Everything (default behavior)
    - No params - Same as `all`

**Data Fetching:**

- Uses shared `getSubmissionDataByToken(token)` from `~/server/utils/submissions`
- Uses shared `getSubmissionEntrancesByToken(token)` from `~/server/utils/submissions`
- Uses shared `getSubmissionTimeline(token)` from `~/server/utils/submissions`

**Returns (based on include params):**

- `submission`: Always returned (core submission data)
- `form`: Form metadata (title, description, theme) [if requested]
- `elements`: All non-deleted form elements [if requested]
- `submissionEntrances`: Raw submission entrance records [if requested]
- `submissionTimeline`: Complete typed timeline using `SubmissionTimelineEvent[]` from `/app/types/submission-timeline.ts` [if requested]
- `webhookDeliveries`: Webhook delivery records [if requested]

**Backward Compatibility:**

- If no query params provided, returns same data as before (all fields)
- Existing callers continue to work without changes

### `/server/utils/webhookDelivery.ts`

Update to use shared `getSubmissionEntrancesByToken` function:

- Import and use `getSubmissionEntrancesByToken` from `~/server/utils/submissions`
- Remove inline entrances query (lines 119-128)
- Map to extract only needed fields (id, timestamp, ipAddress, userAgent, referrer)

### `/server/api/submissions/[token]/download-pdf.get.ts`

Update existing PDF endpoint to use new print view URL with header auth:

- Create new Puppeteer page
- Set `X-Puppeteer-Secret` header via `setExtraHTTPHeaders`
- Navigate to `/print/${token}` route
- Wait for network idle before capturing PDF

## Environment Variable

Add `PUPPETEER_SECRET` to `.env` - a random string for authenticating Puppeteer requests.

## Implementation Steps

- [ ] **Step 1: Add environment variable**
  - Add `PUPPETEER_SECRET` to `.env.example` file with a comment explaining it's used for authenticating Puppeteer requests to submission data endpoints

- [ ] **Step 2: Create timeline type definitions**
  - Create new file `/app/types/submission-timeline.ts`
  - Define `BaseSubmissionTimelineEvent` interface with `timestamp: Date` and `type: 'lifecycle' | 'entrance' | 'webhook'`
  - Define `SubmissionLifecycleEvent` extending base with `event: 'created' | 'started' | 'submitted' | 'locked' | 'expires'` and optional `status: string`
  - Define `SubmissionEntranceEvent` extending base with fields: `id`, `ipAddress`, `userAgent`, `referrer`, `isFormLocked`
  - Define `SubmissionWebhookEvent` extending base with fields: `id`, `webhookUrl`, `status`, `httpStatusCode`, `errorMessage`, `retryCount`, `deliveredAt`
  - Export union type `SubmissionTimelineEvent = SubmissionLifecycleEvent | SubmissionEntranceEvent | SubmissionWebhookEvent`

- [ ] **Step 3: Create shared submission utilities**
  - Create new file `/server/utils/submissions.ts`
  - Import timeline types from `~/app/types/submission-timeline`
  - Import database tables: `submissionsTable`, `formEntrancesTable`, `formsTable`, `formElementsTable`, `webhookDeliveriesTable`
  - Import drizzle operators: `eq`, `and`, `asc`
  - **Function 1**: `getSubmissionDataByToken(token: string)` - Fetch submission data with related entities
    - Query submission by token using `where: eq(submissionsTable.token, token)`, limit 1
    - If not found, throw 404 error
    - Fetch related form using `db.query.formsTable.findFirst` with `where: eq(formsTable.id, submission.formId)`
    - Fetch formElements using `db.query.formElementsTable.findMany` with:
      - `where: and(eq(formElementsTable.formId, submission.formId), eq(formElementsTable.isDeleted, false))`
      - Select columns: `id`, `type`, `position`, `parentId`, `name`, `config`, `isRequired`
      - `orderBy: [asc(formElementsTable.position)]`
    - Return as `SubmissionData` interface containing: `{ submission, form, formElements }`
  - **Function 2**: `getSubmissionEntrancesByToken(token: string)` - Fetch entrances for submission
    - Query entrances where `sessionToken` matches token
    - Order by timestamp ascending using `orderBy(formEntrancesTable.timestamp)`
    - Return full entrance records array
  - **Function 3**: `getSubmissionTimeline(token: string)` - Build unified timeline
    - Call `getSubmissionDataByToken(token)` to get submission data
    - Fetch webhook deliveries using `db.select()` from webhookDeliveriesTable where `submissionId` matches, order by createdAt
    - Build lifecycle events array from submission record timestamps (createdAt, startedAt, submittedAt, lockedAt, expiresAt) - only include non-null timestamps
    - Call `getSubmissionEntrancesByToken(token)` to get entrances
    - Combine all events into single array, sort by timestamp ascending
    - Return as `SubmissionTimelineEvent[]`
  - Export all functions and `SubmissionData` interface

- [ ] **Step 4: Refactor PDF generation utility**
  - Open `/server/utils/generatePDF.ts`
  - Import `getSubmissionDataByToken` and `getSubmissionEntrancesByToken` from `~/server/utils/submissions`
  - Remove the local `getSubmissionData` function (lines 107-146)
  - Replace its usage with imported `getSubmissionDataByToken(token)`
  - Replace inline entrances query (line 138) with `getSubmissionEntrancesByToken(token)`
  - Verify PDF generation still works correctly

- [ ] **Step 5: Refactor webhook delivery utility**
  - Open `/server/utils/webhookDelivery.ts`
  - Import `getSubmissionEntrancesByToken` from `~/server/utils/submissions`
  - Remove inline entrances query (lines 119-128)
  - Replace with `const entrances = await getSubmissionEntrancesByToken(submission.token)`
  - Map entrances to extract only needed fields: `id`, `timestamp`, `ipAddress`, `userAgent`, `referrer`

- [ ] **Step 6: Enhance details endpoint with query parameters**
  - Open `/server/api/submissions/[token]/details.get.ts`
  - Import all utility functions from `~/server/utils/submissions`
  - Import timeline types from `~/app/types/submission-timeline`
  - Add authentication logic: check for `X-Puppeteer-Secret` header first (validate against `process.env.PUPPETEER_SECRET`), if not present use `requireUserSession()` with admin role check
  - Parse query parameter `include` from URL (comma-separated string, default to 'all')
  - Replace inline queries with utility function calls
  - Build response object conditionally based on `include` parameter containing: `submission` (always), `form`, `elements`, `submissionEntrances`, `submissionTimeline`, `webhookDeliveries`
  - Ensure backward compatibility: no params or `include=all` returns all data like before

- [ ] **Step 7: Create print view component**
  - Create new file `/app/components/form-print/FormPrint.vue`
  - Accept props: `form`, `elements`, `values`, `submissionTimeline` (typed as `SubmissionTimelineEvent[]`)
  - Reuse `FormField.vue` component to render form elements with filled values
  - Remove all interactive elements (gates, validation, submit buttons)
  - Display complete submission timeline at bottom with sections for: lifecycle events, entrance events, webhook events
  - Style to match regular PC form view exactly
  - Add `@media print` CSS rules for clean PDF output (hide scrollbars, adjust margins, handle page breaks)

- [ ] **Step 8: Create print page route**
  - Create new file `/app/pages/print/[token].vue`
  - Use `fill` layout (no headers/sidebars)
  - Fetch data from `/api/submissions/[token]/details?include=all` on page load
  - Note: Authentication happens automatically via Puppeteer's `setExtraHTTPHeaders` or browser session cookie
  - Load form theme CSS dynamically based on form metadata
  - **Transform elements to BuilderElement format:**
    - Map each element from API response to BuilderElement with:
      - `clientId: 'el_${element.id}'` (generate prefixed string from numeric id)
      - `parentId: element.parentId ? 'el_${element.parentId}' : null` (transform numeric parentId to prefixed string or null)
      - `position: parseFloat(element.position)` (convert decimal string to number)
      - Keep other fields as-is: `id`, `type`, `name`, `config`, `isRequired`
    - Sort transformed elements by position ascending
  - **Merge and transform values from field names to clientIds:**
    - Merge `submission.prefillData` and `submission.submissionData` into single object (submissionData takes precedence)
    - Transform keys from field names to clientIds:
      - For each key-value pair in merged data, find element where `element.name === key`
      - If element found, add to new object with key `element.clientId` and original value
      - For repeater elements (type === 'repeater' with array values), transform nested items:
        - Each item in array should have its keys transformed from child field names to child clientIds
        - Find child elements and map their names to clientIds
    - Result: `Record<string, any>` keyed by clientId instead of field name
  - Render `FormPrint` component passing: `form`, transformed `elements`, transformed `values`, `submissionTimeline`
  - Add `@media print` styles to page wrapper

- [ ] **Step 9: Update PDF download endpoint**
  - Open `/server/api/submissions/[token]/download-pdf.get.ts`
  - Locate Puppeteer browser automation code
  - Before `page.goto()`, add `await page.setExtraHTTPHeaders({ "X-Puppeteer-Secret": process.env.PUPPETEER_SECRET })`
  - Change navigation URL to `${baseUrl}/print/${token}`
  - Keep `waitUntil: "networkidle0"` option
  - Test that PDF generation still works

## Testing Checklist

### Details Endpoint Query Parameters
- Call `/api/submissions/{token}/details` without params → verify returns all fields (backward compatible)
- Call `/api/submissions/{token}/details?include=all` → verify returns all fields
- Call `/api/submissions/{token}/details?include=form,submissionTimeline` → verify returns only submission, form, and submissionTimeline
- Call `/api/submissions/{token}/details?include=submissionTimeline` → verify returns only submission and submissionTimeline
- Call `/api/submissions/{token}/details?include=submissionEntrances` → verify returns only submission and submissionEntrances

### Authentication
- **Puppeteer auth**: Send request with `X-Puppeteer-Secret` header matching `.env` value → verify 200 response with data
- **No auth**: Send request without header and without session cookie → verify 401 error
- **Admin session**: Login as admin, call endpoint → verify 200 response with data
- **Non-admin session**: Login as non-admin user, call endpoint → verify 403 error

### Timeline Data Quality
- Fetch `submissionTimeline` from details endpoint → verify returned as array
- Check each timeline event has `type` field with value 'lifecycle', 'entrance', or 'webhook'
- Verify events are sorted chronologically by timestamp (earliest first)
- Verify lifecycle events have `event` and optional `status` fields
- Verify entrance events have `id`, `ipAddress`, `userAgent`, `referrer`, `isFormLocked` fields
- Verify webhook events have `id`, `webhookUrl`, `status`, `httpStatusCode`, `errorMessage`, `retryCount`, `deliveredAt` fields

### Print View Display
- As admin, navigate to `/print/{token}` in browser → verify page loads and displays form with filled values
- Verify form styling matches the regular PC form view exactly
- Verify submission timeline displays at bottom with all events in chronological order
- Use browser print preview (Ctrl/Cmd+P) → verify clean output without scrollbars/navigation

### PDF Generation
- Call `/api/submissions/{token}/download-pdf` → verify PDF downloads successfully
- Open PDF → verify contains form data and timeline information
- Verify PDF matches print preview appearance

### Backward Compatibility
- Navigate to existing submission detail page (`/submission-detail/{token}`) → verify still works after refactoring
- Trigger form submission with webhook configured → verify webhook payload includes entrances data correctly
