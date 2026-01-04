import { db } from "~~/server/db";
import { formsTable, formElementsTable, submissionsTable } from "~~/server/db/schema";
import { eq, asc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const id = Number(getRouterParam(event, "id"));

	if (isNaN(id)) {
		throw createError({
			statusCode: 400,
			message: "Invalid form ID",
		});
	}

	// Check for token in query params
	const token = getQuery(event).token as string | undefined;

	const form = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, id),
		with: {
			elements: {
				where: eq(formElementsTable.isDeleted, false),
				orderBy: [asc(formElementsTable.position)],
			},
		},
	});

	if (!form) {
		throw createError({
			statusCode: 404,
			message: "Form not found",
		});
	}

	// If token is provided, fetch submission data for prefill
	let prefillData = null;
	if (token) {
		const submission = await db.query.submissionsTable.findFirst({
			where: eq(submissionsTable.token, token),
		});

		if (submission && submission.formId === id) {
			// Check if token is expired
			if (new Date() > new Date(submission.expiresAt)) {
				throw createError({
					statusCode: 410,
					message: "Submission link has expired",
				});
			}

			prefillData = submission.prefillData;
		}
	}

	return {
		...form,
		prefillData,
	};
});
