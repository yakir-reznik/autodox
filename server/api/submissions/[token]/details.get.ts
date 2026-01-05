import { db } from "~~/server/db";
import { submissionsTable, formEntrancesTable, formsTable } from "~~/server/db/schema";
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

		return {
			success: true,
			data: {
				submission,
				form,
				entrances,
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
