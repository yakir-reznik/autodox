# Reports — Admin Hub + "Submissions by ExternalId" Report

## Context

The app has no admin reports area yet. Operators need to see submission activity grouped by form + `externalId`, broken down by status, over a chosen time window. This adds:

1. A lightweight **hub page** at `/admin/reports` listing available reports (currently just one).
2. A **report page** at `/admin/reports/submissions-by-externalId` with filters (externalId dropdown — optional; date range capped at 1 year by `createdAt`) and a results table with one row per `(form, externalId)` combination, columns: form name, form id, external id, pending, in_progress, submitted, locked, total.

Admin-only access is already enforced globally by `app/middleware/auth.global.ts:81-84`.

## Files to create

### 1. ✅ `app/pages/admin/reports/index.vue` (hub)

- RTL Hebrew page following the layout pattern of `app/pages/forms/index.vue`.
- Header with title ("דוחות" or similar — operator to finalize copy).
- Card grid with one clickable card linking to `/admin/reports/submissions-by-externalId`. Use `app/components/ui/card/`.
- No data fetching.

### 2. ✅ `app/pages/admin/reports/submissions-by-externalId.vue` (report)

- **Filters row** (top):
  - ExternalId dropdown (optional, blank = all). Use `app/components/ui/select/` populated from `GET /api/admin/reports/external-ids`.
  - Date range: two date inputs (`from`, `to`) using `app/components/ui/popover/` + native `<input type="date">` (no date picker exists in the repo — keep it minimal).
  - Client-side validation: `to - from ≤ 365 days`. Show inline error if exceeded; disable "Apply" button.
  - Defaults: last 30 days.
  - Apply button triggers refetch.
- **Table** (reuse styling approach from `app/components/submissions/Table.vue`, specifically `statusColors`/`statusLabels` at ~lines 408-420 for header badges and `toLocaleDateString('he-IL', ...)` for any dates):
  - Columns: Form name, Form ID, External ID, Pending, In progress, Submitted, Locked, Total.
  - Status column labels use existing Hebrew `statusLabels`.
  - Empty state when no rows.
- Data via `useFetch<ReportRow[]>('/api/admin/reports/submissions-by-external-id', { query: { externalId, from, to } })` with `watch` on filters.

### 3. ✅ `server/api/admin/reports/submissions-by-external-id.get.ts`

- Query params: `externalId?: string`, `from: string (ISO date)`, `to: string (ISO date)`.
- Server-side guard: reject if range > 366 days, reject missing `from`/`to`.
- Admin guard: follow pattern used in other admin endpoints (check session user role).
- Drizzle query (reference `server/api/submissions.get.ts` for `and()`/`eq()`/`count()` pattern):
  ```ts
  db.select({
    formId: submissionsTable.formId,
    formName: formsTable.title,
    externalId: submissionsTable.externalId,
    status: submissionsTable.status,
    count: count(),
  })
    .from(submissionsTable)
    .innerJoin(formsTable, eq(formsTable.id, submissionsTable.formId))
    .where(
      and(
        gte(submissionsTable.createdAt, fromDate),
        lte(submissionsTable.createdAt, toDate),
        externalId ? eq(submissionsTable.externalId, externalId) : undefined,
      ),
    )
    .groupBy(
      submissionsTable.formId,
      formsTable.title,
      submissionsTable.externalId,
      submissionsTable.status,
    );
  ```
- Pivot rows in JS: reduce to `{ formId, formName, externalId, pending, in_progress, submitted, locked, total }[]`. Use the `submissionStatusEnum` from `server/db/schema.ts:352` to build zero-initialized counts and avoid typos.
- Sort by `formName` then `externalId`.

### 4. ✅ `server/api/admin/reports/external-ids.get.ts`

- Returns distinct non-null `externalId` values for the dropdown.
- `db.selectDistinct({ externalId: submissionsTable.externalId }).from(submissionsTable).where(isNotNull(submissionsTable.externalId)).orderBy(submissionsTable.externalId)`.

### 5. ✅ `app/types/form-builder.ts` (append)

- Add shared types:
  ```ts
  export type SubmissionsByExternalIdRow = {
    formId: number;
    formName: string;
    externalId: string | null;
    pending: number;
    in_progress: number;
    submitted: number;
    locked: number;
    total: number;
  };
  ```

## Reused existing utilities

- `submissionStatusEnum` / `SubmissionStatus` — `server/db/schema.ts:352`
- `submissionsTable`, `formsTable` — `server/db/schema.ts`
- Drizzle query patterns — `server/api/submissions.get.ts`
- Admin auth — already globally enforced in `app/middleware/auth.global.ts:81-84`
- Status colors/labels (Hebrew) — `app/components/submissions/Table.vue:408-420`
- shadcn `Select`, `Popover`, `Card`, `Button`, `Input` under `app/components/ui/`
- Page layout / RTL pattern — `app/pages/forms/index.vue`

## Verification

1. `pnpm dev`, sign in as admin, navigate to `/admin/reports` — confirm hub renders with one card.
2. Click card → `/admin/reports/submissions-by-externalId` loads with default last-30-days range and empty externalId filter.
3. Table populates with one row per `(form, externalId)` and status counts sum to the total column.
4. Pick a specific externalId → rows filter to only that externalId across forms.
5. Change date range; try to set range > 1 year → apply button disabled / inline error shown; server also rejects.
6. Verify as non-admin: visiting `/admin/reports` redirects home (global middleware).
7. Spot-check counts against a direct DB query for one `(formId, externalId)` pair in the window.
