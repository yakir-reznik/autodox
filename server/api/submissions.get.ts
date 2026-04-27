import { db } from "~~/server/db";
import { submissionsTable, formsTable, formSharesTable } from "~~/server/db/schema";
import { eq, desc, count, and, inArray } from "drizzle-orm";
import { requireRoles, requireFormPermission } from "~~/server/utils/authorization";

const SUBMISSION_FIELDS = {
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
	name: submissionsTable.name,
	lockedAt: submissionsTable.lockedAt,
	isArchived: submissionsTable.isArchived,
	archivedAt: submissionsTable.archivedAt,
};

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const formId = Number(query.formId) || undefined;
	const userId = Number(query.userId) || undefined;
	const sharedWithMe = query.sharedWithMe === "true";
	const archived = query.archived === "true";

	const page = Math.max(1, Number(query.page) || 1);
	const limit = 10;
	const offset = (page - 1) * limit;

	// --- formId mode ---
	if (formId) {
		await requireFormPermission(event, formId, "view_submissions");

		const where = and(eq(submissionsTable.formId, formId), eq(submissionsTable.isArchived, archived));

		const [totalResult, submissions] = await Promise.all([
			db.select({ count: count() }).from(submissionsTable).where(where),
			db.select(SUBMISSION_FIELDS).from(submissionsTable).where(where)
				.orderBy(desc(submissionsTable.createdAt)).limit(limit).offset(offset),
		]);

		return paginated(submissions, totalResult[0]?.count ?? 0, page, limit);
	}

	// --- userId mode ---
	if (userId) {
		const session = await requireRoles(event, ["user"]);
		const isAdmin = session.user.roles.includes("admin");

		if (!isAdmin && session.user.id !== userId) {
			throw createError({ statusCode: 403, message: "Forbidden" });
		}

		const where = and(eq(formsTable.createdBy, userId), eq(submissionsTable.isArchived, archived));

		const [totalResult, submissions] = await Promise.all([
			db.select({ count: count() }).from(submissionsTable)
				.innerJoin(formsTable, eq(submissionsTable.formId, formsTable.id)).where(where),
			db.select({ ...SUBMISSION_FIELDS, formTitle: formsTable.title })
				.from(submissionsTable)
				.innerJoin(formsTable, eq(submissionsTable.formId, formsTable.id))
				.where(where)
				.orderBy(desc(submissionsTable.createdAt)).limit(limit).offset(offset),
		]);

		return paginated(submissions, totalResult[0]?.count ?? 0, page, limit);
	}

	// --- sharedWithMe mode ---
	if (sharedWithMe) {
		const session = await requireRoles(event, ["user"]);

		const shares = await db.query.formSharesTable.findMany({
			where: and(
				eq(formSharesTable.granteeUserId, session.user.id),
				eq(formSharesTable.canViewSubmissions, true),
			),
		});

		if (shares.length === 0) {
			return paginated([], 0, page, limit);
		}

		const formIds = shares.map((s) => s.formId);
		const where = and(inArray(submissionsTable.formId, formIds), eq(submissionsTable.isArchived, archived));

		const [totalResult, submissions] = await Promise.all([
			db.select({ count: count() }).from(submissionsTable)
				.innerJoin(formsTable, eq(submissionsTable.formId, formsTable.id)).where(where),
			db.select({ ...SUBMISSION_FIELDS, formTitle: formsTable.title })
				.from(submissionsTable)
				.innerJoin(formsTable, eq(submissionsTable.formId, formsTable.id))
				.where(where)
				.orderBy(desc(submissionsTable.createdAt)).limit(limit).offset(offset),
		]);

		return paginated(submissions, totalResult[0]?.count ?? 0, page, limit);
	}

	throw createError({ statusCode: 400, message: "formId, userId, or sharedWithMe is required" });
});

function paginated<T>(data: T[], total: number, page: number, limit: number) {
	const totalPages = Math.ceil(total / limit);
	return {
		data,
		pagination: {
			page,
			limit,
			total,
			totalPages,
			hasNextPage: page < totalPages,
			hasPreviousPage: page > 1,
		},
	};
}
