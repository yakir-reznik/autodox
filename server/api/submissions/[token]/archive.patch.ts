import { db } from "~~/server/db";
import { submissionsTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event);

	if (user.role !== "admin") {
		throw createError({ statusCode: 403, message: "Only admin users can access this endpoint" });
	}

	const token = getRouterParam(event, "token");
	if (!token) {
		throw createError({ statusCode: 400, message: "Submission token is required" });
	}

	const [submission] = await db
		.select({ id: submissionsTable.id, isArchived: submissionsTable.isArchived })
		.from(submissionsTable)
		.where(eq(submissionsTable.token, token))
		.limit(1);

	if (!submission) {
		throw createError({ statusCode: 404, message: "Submission not found" });
	}

	const nowArchived = !submission.isArchived;

	await db
		.update(submissionsTable)
		.set({
			isArchived: nowArchived,
			archivedAt: nowArchived ? new Date() : null,
		})
		.where(eq(submissionsTable.id, submission.id));

	return {
		isArchived: nowArchived,
		archivedAt: nowArchived ? new Date().toISOString() : null,
	};
});
