import { db } from "~~/server/db";
import { submissionsTable, formsTable } from "~~/server/db/schema";
import { eq, desc, count, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const formId = Number(query.formId) || undefined;
	const userId = Number(query.userId) || undefined;

	if (!formId && !userId) {
		throw createError({ statusCode: 400, message: "formId or userId is required" });
	}

	// Build where conditions
	const conditions = [];
	if (formId) conditions.push(eq(submissionsTable.formId, formId));
	if (userId) conditions.push(eq(formsTable.createdBy, userId));
	const where = conditions.length === 1 ? conditions[0] : and(...conditions);

	const page = Math.max(1, Number(query.page) || 1);
	const limit = 10;
	const offset = (page - 1) * limit;

	const needsJoin = !!userId;

	const [totalResult, submissions] = await Promise.all([
		needsJoin
			? db
					.select({ count: count() })
					.from(submissionsTable)
					.innerJoin(formsTable, eq(submissionsTable.formId, formsTable.id))
					.where(where)
			: db
					.select({ count: count() })
					.from(submissionsTable)
					.where(where),
		needsJoin
			? db
					.select({
						id: submissionsTable.id,
						token: submissionsTable.token,
						formId: submissionsTable.formId,
						prefillData: submissionsTable.prefillData,
						additionalData: submissionsTable.additionalData,
						createdByUserId: submissionsTable.createdByUserId,
						expiresAt: submissionsTable.expiresAt,
						status: submissionsTable.status,
						isPublic: submissionsTable.isPublic,
						submissionData: submissionsTable.submissionData,
						createdAt: submissionsTable.createdAt,
						startedAt: submissionsTable.startedAt,
						submittedAt: submissionsTable.submittedAt,
						lockedAt: submissionsTable.lockedAt,
						formTitle: formsTable.title,
					})
					.from(submissionsTable)
					.innerJoin(formsTable, eq(submissionsTable.formId, formsTable.id))
					.where(where)
					.orderBy(desc(submissionsTable.createdAt))
					.limit(limit)
					.offset(offset)
			: db
					.select({
						id: submissionsTable.id,
						token: submissionsTable.token,
						formId: submissionsTable.formId,
						prefillData: submissionsTable.prefillData,
						additionalData: submissionsTable.additionalData,
						createdByUserId: submissionsTable.createdByUserId,
						expiresAt: submissionsTable.expiresAt,
						status: submissionsTable.status,
						isPublic: submissionsTable.isPublic,
						submissionData: submissionsTable.submissionData,
						createdAt: submissionsTable.createdAt,
						startedAt: submissionsTable.startedAt,
						submittedAt: submissionsTable.submittedAt,
						lockedAt: submissionsTable.lockedAt,
					})
					.from(submissionsTable)
					.where(where)
					.orderBy(desc(submissionsTable.createdAt))
					.limit(limit)
					.offset(offset),
	]);

	const total = totalResult[0]?.count ?? 0;
	const totalPages = Math.ceil(total / limit);

	return {
		data: submissions,
		pagination: {
			page,
			limit,
			total,
			totalPages,
			hasNextPage: page < totalPages,
			hasPreviousPage: page > 1,
		},
	};
});
