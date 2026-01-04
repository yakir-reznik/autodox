import { db } from "~~/server/db";
import { submissionsTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const token = getRouterParam(event, "token");

	if (!token) {
		throw createError({
			statusCode: 400,
			message: "Submission token is required",
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

	// Check if submission has expired
	if (submission.expiresAt && new Date(submission.expiresAt) < new Date()) {
		throw createError({
			statusCode: 403,
			message: "This submission link has expired",
		});
	}

	// Only update if status is 'pending' (first access)
	if (submission.status === "pending") {
		await db
			.update(submissionsTable)
			.set({
				status: "in_progress",
				startedAt: new Date(),
			})
			.where(eq(submissionsTable.token, token));
	}

	return {
		success: true,
		status: submission.status === "pending" ? "in_progress" : submission.status,
	};
});
