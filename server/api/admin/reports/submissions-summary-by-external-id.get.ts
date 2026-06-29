import {
	getExternalIdPerformanceRows,
	parseReportDateRange,
} from "~~/server/utils/adminReports";
import { requireRoles } from "~~/server/utils/authorization";

export default defineEventHandler(async (event) => {
	await requireRoles(event, ["admin"]);

	const rows = await getExternalIdPerformanceRows(parseReportDateRange(getQuery(event)));

	return {
		externalIds: rows.map((row) => ({
			externalId: row.externalId,
			total: row.total,
		})),
		externalIdStatuses: rows,
		total: rows.reduce((sum, row) => sum + row.total, 0),
	};
});
