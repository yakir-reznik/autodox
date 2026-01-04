import { db } from "~~/server/db";
import { submissionsTable, formEntrancesTable, usersTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";
import { H3Error, createError, getHeader, getRouterParam } from "h3";

export default defineEventHandler(async (event) => {
	try {
		const token = getRouterParam(event, "token");

		if (!token) {
			throw createError({
				statusCode: 400,
				message: "Submission token is required",
			});
		}

		// Get API key from headers
		const apiKey = getHeader(event, "x-api-key");

		if (!apiKey) {
			throw createError({
				statusCode: 401,
				message: "API key is required in headers",
			});
		}

		// Authenticate user via API token and verify admin role
		const user = await db.query.usersTable.findFirst({
			where: eq(usersTable.apiKey, apiKey),
		});

		if (!user) {
			throw createError({
				statusCode: 401,
				message: "Invalid API key",
			});
		}

		// Check if user is admin
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

		// Get all form entrances for this submission's form
		const entrances = await db
			.select()
			.from(formEntrancesTable)
			.where(eq(formEntrancesTable.formId, submission.formId))
			.orderBy(formEntrancesTable.timestamp);

		return {
			success: true,
			data: {
				submission,
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
