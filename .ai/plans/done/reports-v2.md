# Reports V2

## Summary

Improve the existing admin reports instead of adding a separate page for every metric. Keep the current `externalId` reports as the foundation, upgrade them with completion and fill-time analytics, add one new form performance report, and show overview metrics directly on the reports index page.

## Reports To Keep And Improve

- ✅ **Reports index overview**: show top-level metrics directly on `/manage/reports`: total submissions, status totals, completion rate, public vs token submissions, archived count, and average fill time.
- ✅ **External ID performance**: upgrade the existing summary report (`submissions-summary-by-externalId`) into one row per `externalId` with total/status counts, unique forms count, completion rate, and average fill time.
- ✅ **Form + External ID breakdown**: upgrade the existing detailed report (`submissions-by-externalId`) with completion rate and average fill time per `(form, externalId)`.
- ✅ **Form performance**: add one new report page with one row per form, total/status counts, started count, submitted count, completion rate, and average fill time.

## Key Changes

- ✅ Add `server/utils/adminReports.ts` for shared report logic:
	- validate `from` / `to`, default to last 30 days, cap at 366 days
	- build common date, `externalId`, `formId`, archived, and public/token filters
	- zero-fill status counts from `submissionStatusEnum`
	- calculate fill time as `submittedAt - startedAt` in seconds when both exist
- ✅ Add endpoints:
	- `GET /api/admin/reports/overview`
	- `GET /api/admin/reports/forms-performance`
- ✅ Update existing endpoints:
	- `GET /api/admin/reports/submissions-summary-by-external-id`
	- `GET /api/admin/reports/submissions-by-external-id`
- ✅ Add shared response types in `app/types/reports.ts`.
- ✅ Update `/manage/reports` cards and Hebrew labels to match the consolidated report set.
- ✅ Add shared date range presets: past 30 days, today, yesterday, this week, last week, this month, last month, this year, last year.

## Filters And Sorting

- ✅ Every report view gets date range pickers with last 30 days as the default.
- ✅ Server validates the range; UI disables apply for invalid ranges.
- ✅ Default sorting:
	- Reports index overview: top lists sorted by total descending.
	- External ID performance: total submissions descending.
	- Form + External ID breakdown: form name ascending, then total submissions descending.
	- Form performance: total submissions descending.
- ✅ Table headers are clickable for sortable columns: names, totals, status counts, started/submitted counts, completion rate, unique forms count, and average fill time.
- ✅ Sorting can be client-side after fetch; keep endpoint query params focused on filters unless result size becomes a problem.

## Test Plan

- Run `pnpm run typecheck`.
- Manually verify the reports index overview and each report page as admin.
- Check date validation, empty states, default sort order, and clickable header sorting.
- Spot-check one form and one `externalId` against DB rows.
- Do not add automated tests unless explicitly approved.

## Assumptions

- Fill time means `submittedAt - startedAt`, not `createdAt - submittedAt`.
- Date filtering is based on `submissions.createdAt`.
- No daily activity or webhook delivery report is included.
- No schema changes or migrations are needed.
