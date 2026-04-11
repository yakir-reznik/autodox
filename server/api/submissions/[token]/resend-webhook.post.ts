import { db } from "~~/server/db";
import { submissionsTable, formsTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";
import { deliverWebhook } from "~~/server/utils/webhookDelivery";
import { resolveFormSettings } from "~~/server/utils/overrideableFormSettings";

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

	const [form] = await db
		.select()
		.from(formsTable)
		.where(eq(formsTable.id, submission.formId))
		.limit(1);

	const { webhookIncludePdf } = resolveFormSettings(form, submission);

	const result = await deliverWebhook(submission.id, submission.webhookUrl, { includePdf: !!webhookIncludePdf });

	return { success: true, data: result };
});
