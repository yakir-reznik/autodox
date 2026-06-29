import { getOverviewReport, parseReportDateRange } from "~~/server/utils/adminReports";
import { requireRoles } from "~~/server/utils/authorization";

export default defineEventHandler(async (event) => {
	await requireRoles(event, ["admin"]);

	return getOverviewReport(parseReportDateRange(getQuery(event)));
});
