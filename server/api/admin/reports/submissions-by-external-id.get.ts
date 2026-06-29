import {
	getFormExternalIdPerformanceRows,
	getReportFilters,
	parseReportDateRange,
} from "~~/server/utils/adminReports";
import { requireRoles } from "~~/server/utils/authorization";

export default defineEventHandler(async (event) => {
	await requireRoles(event, ["admin"]);

	const query = getQuery(event);
	const range = parseReportDateRange(query);

	return getFormExternalIdPerformanceRows(range, getReportFilters(query));
});
