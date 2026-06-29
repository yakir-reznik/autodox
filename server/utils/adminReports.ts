import { and, count, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { db } from "~~/server/db";
import { formsTable, submissionStatusEnum, submissionsTable } from "~~/server/db/schema";

export type ReportDateRange = {
	fromDate: Date;
	toDate: Date;
	from: string;
	to: string;
};

type ReportFilters = {
	externalId?: string;
	formId?: number;
	archived?: boolean;
	isPublic?: boolean;
};

export type ReportStatusSummary = {
	pending: number;
	in_progress: number;
	submitted: number;
	locked: number;
	total: number;
};

type MetricBase = ReportStatusSummary & {
	startedCount: number;
	submittedCount: number;
	completionRate: number;
	avgFillTimeSeconds: number | null;
};

export type FormPerformanceRow = MetricBase & {
	formId: number;
	formName: string;
};

export type ExternalIdPerformanceRow = MetricBase & {
	externalId: string | null;
	uniqueFormsCount: number;
};

export type FormExternalIdPerformanceRow = FormPerformanceRow & {
	externalId: string | null;
};

export type OverviewReport = MetricBase & {
	publicCount: number;
	tokenCount: number;
	archivedCount: number;
	topForms: FormPerformanceRow[];
	topExternalIds: ExternalIdPerformanceRow[];
};

export function parseReportDateRange(query: Record<string, unknown>): ReportDateRange {
	const today = new Date();
	const defaultTo = today.toISOString().slice(0, 10);
	const defaultFromDate = new Date(today);
	defaultFromDate.setDate(defaultFromDate.getDate() - 30);
	const defaultFrom = defaultFromDate.toISOString().slice(0, 10);

	const from = queryString(query.from) || defaultFrom;
	const to = queryString(query.to) || defaultTo;
	const fromDate = new Date(from);
	const toDate = new Date(to);

	if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
		throw createError({ statusCode: 400, message: "Invalid date range" });
	}

	toDate.setHours(23, 59, 59, 999);

	const diffDays = (toDate.getTime() - fromDate.getTime()) / 86400000;
	if (diffDays < 0) {
		throw createError({ statusCode: 400, message: "to must be after from" });
	}
	if (diffDays > 366) {
		throw createError({ statusCode: 400, message: "Date range cannot exceed 366 days" });
	}

	return { fromDate, toDate, from, to };
}

export function getReportFilters(query: Record<string, unknown>): ReportFilters {
	const formId = Number(query.formId) || undefined;

	return {
		externalId: queryString(query.externalId),
		formId,
		archived: queryBoolean(query.archived),
		isPublic: queryBoolean(query.isPublic),
	};
}

export function buildReportConditions(range: ReportDateRange, filters: ReportFilters = {}) {
	const conditions: SQL[] = [
		gte(submissionsTable.createdAt, range.fromDate),
		lte(submissionsTable.createdAt, range.toDate),
	];

	if (filters.externalId) conditions.push(eq(submissionsTable.externalId, filters.externalId));
	if (filters.formId) conditions.push(eq(submissionsTable.formId, filters.formId));
	if (filters.archived !== undefined) conditions.push(eq(submissionsTable.isArchived, filters.archived));
	if (filters.isPublic !== undefined) conditions.push(eq(submissionsTable.isPublic, filters.isPublic));

	return conditions;
}

export function zeroStatusSummary(): ReportStatusSummary {
	return {
		...Object.fromEntries(submissionStatusEnum.map((status) => [status, 0])),
		total: 0,
	} as ReportStatusSummary;
}

export async function getOverviewReport(range: ReportDateRange): Promise<OverviewReport> {
	const where = and(...buildReportConditions(range));

	const [totals] = await db
		.select({
			...statusMetricSelect(),
			publicCount: sumWhen(sql`${submissionsTable.isPublic} = true`),
			tokenCount: sumWhen(sql`${submissionsTable.isPublic} = false`),
			archivedCount: sumWhen(sql`${submissionsTable.isArchived} = true`),
		})
		.from(submissionsTable)
		.where(where);

	const [topForms, topExternalIds] = await Promise.all([
		getFormPerformanceRows(range),
		getExternalIdPerformanceRows(range),
	]);

	return {
		...mapMetrics(totals),
		publicCount: toNumber(totals?.publicCount),
		tokenCount: toNumber(totals?.tokenCount),
		archivedCount: toNumber(totals?.archivedCount),
		topForms: topForms.slice(0, 5),
		topExternalIds: topExternalIds.slice(0, 5),
	};
}

export async function getFormPerformanceRows(
	range: ReportDateRange,
	filters: ReportFilters = {},
): Promise<FormPerformanceRow[]> {
	const rows = await db
		.select({
			formId: submissionsTable.formId,
			formName: formsTable.title,
			...statusMetricSelect(),
		})
		.from(submissionsTable)
		.innerJoin(formsTable, eq(formsTable.id, submissionsTable.formId))
		.where(and(...buildReportConditions(range, filters)))
		.groupBy(submissionsTable.formId, formsTable.title);

	return rows
		.map((row) => ({
			formId: row.formId,
			formName: row.formName,
			...mapMetrics(row),
		}))
		.sort((a, b) => b.total - a.total || a.formName.localeCompare(b.formName, "he"));
}

export async function getExternalIdPerformanceRows(
	range: ReportDateRange,
	filters: ReportFilters = {},
): Promise<ExternalIdPerformanceRow[]> {
	const rows = await db
		.select({
			externalId: submissionsTable.externalId,
			uniqueFormsCount: sql<number>`count(distinct ${submissionsTable.formId})`,
			...statusMetricSelect(),
		})
		.from(submissionsTable)
		.where(and(...buildReportConditions(range, filters)))
		.groupBy(submissionsTable.externalId);

	return rows
		.map((row) => ({
			externalId: row.externalId ?? null,
			uniqueFormsCount: toNumber(row.uniqueFormsCount),
			...mapMetrics(row),
		}))
		.sort((a, b) => b.total - a.total || (a.externalId ?? "").localeCompare(b.externalId ?? "", "he"));
}

export async function getFormExternalIdPerformanceRows(
	range: ReportDateRange,
	filters: ReportFilters = {},
): Promise<FormExternalIdPerformanceRow[]> {
	const rows = await db
		.select({
			formId: submissionsTable.formId,
			formName: formsTable.title,
			externalId: submissionsTable.externalId,
			...statusMetricSelect(),
		})
		.from(submissionsTable)
		.innerJoin(formsTable, eq(formsTable.id, submissionsTable.formId))
		.where(and(...buildReportConditions(range, filters)))
		.groupBy(submissionsTable.formId, formsTable.title, submissionsTable.externalId);

	return rows
		.map((row) => ({
			formId: row.formId,
			formName: row.formName,
			externalId: row.externalId ?? null,
			...mapMetrics(row),
		}))
		.sort(
			(a, b) =>
				a.formName.localeCompare(b.formName, "he") ||
				b.total - a.total ||
				(a.externalId ?? "").localeCompare(b.externalId ?? "", "he"),
		);
}

function statusMetricSelect() {
	return {
		pending: sumWhen(sql`${submissionsTable.status} = 'pending'`),
		in_progress: sumWhen(sql`${submissionsTable.status} = 'in_progress'`),
		submitted: sumWhen(sql`${submissionsTable.status} = 'submitted'`),
		locked: sumWhen(sql`${submissionsTable.status} = 'locked'`),
		total: count(),
		startedCount: sumWhen(sql`${submissionsTable.startedAt} is not null`),
		submittedCount: sumWhen(sql`${submissionsTable.submittedAt} is not null`),
		avgFillTimeSeconds: sql<number | null>`avg(case when ${submissionsTable.startedAt} is not null and ${submissionsTable.submittedAt} is not null then timestampdiff(second, ${submissionsTable.startedAt}, ${submissionsTable.submittedAt}) end)`,
	};
}

function sumWhen(condition: SQL) {
	return sql<number>`sum(case when ${condition} then 1 else 0 end)`;
}

function mapMetrics(row: Record<string, unknown> | undefined): MetricBase {
	const pending = toNumber(row?.pending);
	const in_progress = toNumber(row?.in_progress);
	const submitted = toNumber(row?.submitted);
	const locked = toNumber(row?.locked);
	const total = toNumber(row?.total);
	const submittedCount = toNumber(row?.submittedCount);

	return {
		pending,
		in_progress,
		submitted,
		locked,
		total,
		startedCount: toNumber(row?.startedCount),
		submittedCount,
		completionRate: total > 0 ? Math.round((submittedCount / total) * 10000) / 100 : 0,
		avgFillTimeSeconds: row?.avgFillTimeSeconds == null ? null : Math.round(toNumber(row.avgFillTimeSeconds)),
	};
}

function toNumber(value: unknown) {
	return Number(value ?? 0);
}

function queryString(value: unknown) {
	if (Array.isArray(value)) return queryString(value[0]);
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed || undefined;
}

function queryBoolean(value: unknown) {
	const str = queryString(value);
	if (str === "true") return true;
	if (str === "false") return false;
	return undefined;
}
