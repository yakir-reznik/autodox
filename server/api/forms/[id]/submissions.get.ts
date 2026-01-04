import { db } from "~~/server/db";
import { submissionsTable, formsTable } from "~~/server/db/schema";
import { eq, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const id = Number(getRouterParam(event, "id"));

	if (isNaN(id)) {
		throw createError({
			statusCode: 400,
			message: "Invalid form ID",
		});
	}

	// Verify form exists
	const form = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, id),
	});

	if (!form) {
		throw createError({
			statusCode: 404,
			message: "Form not found",
		});
	}

	// Get pagination parameters
	const query = getQuery(event);
	const page = Math.max(1, Number(query.page) || 1);
	const limit = 20;
	const offset = (page - 1) * limit;

	// Get total count of submissions for this form
	const countResult = await db
		.select()
		.from(submissionsTable)
		.where(eq(submissionsTable.formId, id));
	const total = countResult.length;

	// Get submissions for this page
	const submissions = await db
		.select()
		.from(submissionsTable)
		.where(eq(submissionsTable.formId, id))
		.orderBy(desc(submissionsTable.createdAt))
		.limit(limit)
		.offset(offset);

	const totalPages = Math.ceil(total / limit);

	return {
		data: submissions,
		pagination: {
			page,
			limit,
			total,
			totalPages,
			hasNextPage: page < totalPages,
			hasPreviousPage: page > 1,
		},
	};
});
