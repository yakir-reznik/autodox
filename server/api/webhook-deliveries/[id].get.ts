import { db } from "~~/server/db";
import { webhookDeliveriesTable, submissionsTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";
import { requireSubmissionPermission } from "~~/server/utils/authorization";

export default defineEventHandler(async (event) => {
	const id = Number(getRouterParam(event, "id"));
	if (!id || isNaN(id)) {
		throw createError({ statusCode: 400, message: "Invalid delivery ID" });
	}

	const [delivery] = await db
		.select({
			id: webhookDeliveriesTable.id,
			submissionId: webhookDeliveriesTable.submissionId,
			webhookUrl: webhookDeliveriesTable.webhookUrl,
			status: webhookDeliveriesTable.status,
			httpStatusCode: webhookDeliveriesTable.httpStatusCode,
			errorMessage: webhookDeliveriesTable.errorMessage,
			requestPayload: webhookDeliveriesTable.requestPayload,
			requestHeaders: webhookDeliveriesTable.requestHeaders,
			responseBody: webhookDeliveriesTable.responseBody,
			responseHeaders: webhookDeliveriesTable.responseHeaders,
			retryCount: webhookDeliveriesTable.retryCount,
			deliveredAt: webhookDeliveriesTable.deliveredAt,
			createdAt: webhookDeliveriesTable.createdAt,
		})
		.from(webhookDeliveriesTable)
		.where(eq(webhookDeliveriesTable.id, id));

	if (!delivery) {
		throw createError({ statusCode: 404, message: "Delivery not found" });
	}

	const [submission] = await db
		.select({ token: submissionsTable.token })
		.from(submissionsTable)
		.where(eq(submissionsTable.id, delivery.submissionId))
		.limit(1);

	if (!submission) {
		throw createError({ statusCode: 404, message: "Submission not found" });
	}

	await requireSubmissionPermission(event, submission.token, "view_submissions");

	return { success: true, data: delivery };
});
