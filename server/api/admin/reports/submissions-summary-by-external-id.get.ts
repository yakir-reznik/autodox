import { db } from "~~/server/db";
import { formsTable, submissionStatusEnum, submissionsTable } from "~~/server/db/schema";
import { and, count, eq, gte, lte } from "drizzle-orm";
import { requireRoles } from "~~/server/utils/authorization";

type StatusSummary = {
	pending: number;
	in_progress: number;
	submitted: number;
	locked: number;
	total: number;
};

type FormSummaryRow = {
	formId: number;
	formName: string;
} & StatusSummary;

export default defineEventHandler(async (event) => {
	await requireRoles(event, ["admin"]);

	const query = getQuery(event);
	const { from, to } = query as Record<string, string>;

	if (!from || !to) {
		throw createError({ statusCode: 400, message: "from and to are required" });
	}

	const fromDate = new Date(from);
	const toDate = new Date(to);
	toDate.setHours(23, 59, 59, 999);

	const diffDays = (toDate.getTime() - fromDate.getTime()) / 86400000;
	if (diffDays < 0) {
		throw createError({ statusCode: 400, message: "to must be after from" });
	}
	if (diffDays > 366) {
		throw createError({ statusCode: 400, message: "Date range cannot exceed 366 days" });
	}

	const dateConditions = and(
		gte(submissionsTable.createdAt, fromDate),
		lte(submissionsTable.createdAt, toDate),
	);

	const [externalRows, formStatusRows] = await Promise.all([
		db
			.select({
				externalId: submissionsTable.externalId,
				total: count(),
			})
			.from(submissionsTable)
			.where(dateConditions)
			.groupBy(submissionsTable.externalId),
		db
			.select({
				formId: submissionsTable.formId,
				formName: formsTable.title,
				status: submissionsTable.status,
				count: count(),
			})
			.from(submissionsTable)
			.innerJoin(formsTable, eq(formsTable.id, submissionsTable.formId))
			.where(dateConditions)
			.groupBy(submissionsTable.formId, formsTable.title, submissionsTable.status),
	]);

	const zeroStatusSummary = () =>
		({
			...Object.fromEntries(submissionStatusEnum.map((status) => [status, 0])),
			total: 0,
		}) as StatusSummary;

	const forms = new Map<number, FormSummaryRow>();

	for (const row of formStatusRows) {
		if (!forms.has(row.formId)) {
			forms.set(row.formId, {
				formId: row.formId,
				formName: row.formName,
				...zeroStatusSummary(),
			});
		}

		const entry = forms.get(row.formId)!;
		entry[row.status] = row.count;
		entry.total += row.count;
	}

	const externalIds = externalRows
		.map((row) => ({
			externalId: row.externalId ?? null,
			total: row.total,
		}))
		.sort((a, b) => (a.externalId ?? "").localeCompare(b.externalId ?? "", "he"));

	return {
		externalIds,
		forms: [...forms.values()].sort((a, b) => a.formName.localeCompare(b.formName, "he")),
		total: externalIds.reduce((sum, row) => sum + row.total, 0),
	};
});
