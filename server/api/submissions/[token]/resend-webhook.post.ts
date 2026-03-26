import { db } from "~~/server/db";
import { submissionsTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";
import { deliverWebhook } from "~~/server/utils/webhookDelivery";

export default defineEventHandler(async (event) => {
	const token = getRouterParam(event, "token");

	if (!token) {
		throw createError({ statusCode: 400, message: "Submission token is required" });
	}

	const { user } = await requireUserSession(event);

	if (user.role !== "admin") {
		throw createError({ statusCode: 403, message: "Only admin users can access this endpoint" });
	}

	const [submission] = await db
		.select()
		.from(submissionsTable)
		.where(eq(submissionsTable.token, token))
		.limit(1);

	if (!submission) {
		throw createError({ statusCode: 404, message: "Submission not found" });
	}

	const result = await deliverWebhook(submission.id, submission.webhookUrl);

	return { success: true, data: result };
});
