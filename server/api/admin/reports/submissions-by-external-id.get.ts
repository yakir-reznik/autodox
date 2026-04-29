import { db } from "~~/server/db";
import { submissionsTable, formsTable, submissionStatusEnum } from "~~/server/db/schema";
import { eq, and, gte, lte, count } from "drizzle-orm";

type ReportRow = {
	formId: number;
	formName: string;
	externalId: string | null;
	pending: number;
	in_progress: number;
	submitted: number;
	locked: number;
	total: number;
};

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event);
	if (!session.user?.roles?.includes("admin")) {
		throw createError({ statusCode: 403, message: "Admin access required" });
	}

	const query = getQuery(event);
	const { externalId, from, to } = query as Record<string, string>;

	if (!from || !to) {
		throw createError({ statusCode: 400, message: "from and to are required" });
	}

	const fromDate = new Date(from);
	const toDate = new Date(to);
	toDate.setHours(23, 59, 59, 999);

	const diffDays = (toDate.getTime() - fromDate.getTime()) / 86400000;
	if (diffDays > 366) {
		throw createError({ statusCode: 400, message: "Date range cannot exceed 366 days" });
	}

	const conditions = [
		gte(submissionsTable.createdAt, fromDate),
		lte(submissionsTable.createdAt, toDate),
	];
	if (externalId) conditions.push(eq(submissionsTable.externalId, externalId));

	const rawRows = await db
		.select({
			formId: submissionsTable.formId,
			formName: formsTable.title,
			externalId: submissionsTable.externalId,
			status: submissionsTable.status,
			count: count(),
		})
		.from(submissionsTable)
		.innerJoin(formsTable, eq(formsTable.id, submissionsTable.formId))
		.where(and(...conditions))
		.groupBy(
			submissionsTable.formId,
			formsTable.title,
			submissionsTable.externalId,
			submissionsTable.status,
		);

	const map = new Map<string, ReportRow>();

	for (const row of rawRows) {
		const key = `${row.formId}:${row.externalId ?? ""}`;
		if (!map.has(key)) {
			const zero = Object.fromEntries(submissionStatusEnum.map((s) => [s, 0])) as Record<
				string,
				number
			>;
			map.set(key, {
				formId: row.formId,
				formName: row.formName,
				externalId: row.externalId ?? null,
				...zero,
				total: 0,
			} as ReportRow);
		}
		const entry = map.get(key)!;
		(entry as Record<string, unknown>)[row.status] = row.count;
		entry.total += row.count;
	}

	return [...map.values()].sort((a, b) => {
		const nameCompare = a.formName.localeCompare(b.formName, "he");
		if (nameCompare !== 0) return nameCompare;
		return (a.externalId ?? "").localeCompare(b.externalId ?? "", "he");
	});
});
