import { db } from "~~/server/db";
import { submissionsTable, formEntrancesTable, formsTable, webhookDeliveriesTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";
import { H3Error, createError, getRouterParam } from "h3";

export default defineEventHandler(async (event) => {
	try {
		const token = getRouterParam(event, "token");

		if (!token) {
			throw createError({
				statusCode: 400,
				message: "Submission token is required",
			});
		}

		// Check if user is authenticated and is an admin
		const { user } = await requireUserSession(event);

		if (user.role !== "admin") {
			throw createError({
				statusCode: 403,
				message: "Only admin users can access this endpoint",
			});
		}

		// Find the submission by token
		const [submission] = await db
			.select()
			.from(submissionsTable)
			.where(eq(submissionsTable.token, token))
			.limit(1);

		if (!submission) {
			throw createError({
				statusCode: 404,
				message: "Submission not found",
			});
		}

		// Get the form details
		const form = await db.query.formsTable.findFirst({
			where: eq(formsTable.id, submission.formId),
		});

		// Get all form entrances for this specific submission (by token)
		const entrances = await db
			.select()
			.from(formEntrancesTable)
			.where(eq(formEntrancesTable.sessionToken, token))
			.orderBy(formEntrancesTable.timestamp);

		// Get all webhook deliveries for this submission (exclude large payload data)
		const webhookDeliveries = await db
			.select({
				id: webhookDeliveriesTable.id,
				submissionId: webhookDeliveriesTable.submissionId,
				webhookUrl: webhookDeliveriesTable.webhookUrl,
				status: webhookDeliveriesTable.status,
				httpStatusCode: webhookDeliveriesTable.httpStatusCode,
				errorMessage: webhookDeliveriesTable.errorMessage,
				retryCount: webhookDeliveriesTable.retryCount,
				deliveredAt: webhookDeliveriesTable.deliveredAt,
				createdAt: webhookDeliveriesTable.createdAt,
			})
			.from(webhookDeliveriesTable)
			.where(eq(webhookDeliveriesTable.submissionId, submission.id))
			.orderBy(webhookDeliveriesTable.createdAt);

		return {
			success: true,
			data: {
				submission,
				form,
				entrances,
				webhookDeliveries,
			},
		};
	} catch (error) {
		if (error instanceof H3Error) {
			throw error;
		}
		console.error(error);
		setResponseStatus(event, 500);
		return {
			success: false,
			message: "Internal server error",
		};
	}
});
