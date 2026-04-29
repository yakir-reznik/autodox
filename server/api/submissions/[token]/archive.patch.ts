import { db } from "~~/server/db";
import { submissionsTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";
import { requireSubmissionPermission } from "~~/server/utils/authorization";

export default defineEventHandler(async (event) => {
	const token = getRouterParam(event, "token");
	if (!token) {
		throw createError({ statusCode: 400, message: "Submission token is required" });
	}

	const { submission } = await requireSubmissionPermission(event, token, "manage_submissions");

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
