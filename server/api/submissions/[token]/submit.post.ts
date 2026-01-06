import { db } from "~~/server/db";
import { submissionsTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";
import { deliverWebhook } from "~~/server/utils/webhookDelivery";

export default defineEventHandler(async (event) => {
	const token = getRouterParam(event, "token");

	if (!token) {
		throw createError({
			statusCode: 400,
			message: "Submission token is required",
		});
	}

	const body = await readBody(event);
	const { submissionData } = body;

	if (!submissionData || typeof submissionData !== "object") {
		throw createError({
			statusCode: 400,
			message: "Submission data is required",
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

	// Check if submission is already locked
	if (submission.status === "locked") {
		throw createError({
			statusCode: 403,
			message: "This submission is locked and cannot be modified",
		});
	}

	// Check if submission has expired
	if (submission.expiresAt && new Date(submission.expiresAt) < new Date()) {
		throw createError({
			statusCode: 403,
			message: "This submission link has expired",
		});
	}

	// Update submission with data and lock it
	const now = new Date();
	await db
		.update(submissionsTable)
		.set({
			submissionData,
			status: "locked",
			submittedAt: now,
			lockedAt: now,
		})
		.where(eq(submissionsTable.token, token));

	// Trigger webhook delivery asynchronously (don't block the response)
	// We use setImmediate to not block the response
	setImmediate(async () => {
		try {
			await deliverWebhook(submission.id, submission.webhookUrl);
		} catch (error) {
			console.error("Webhook delivery failed:", error);
		}
	});

	return {
		success: true,
		message: "Form submitted successfully",
	};
});
