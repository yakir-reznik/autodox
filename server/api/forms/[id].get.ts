import { db } from "~~/server/db";
import { formsTable, formElementsTable } from "~~/server/db/schema";
import { eq, asc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const id = Number(getRouterParam(event, "id"));

	if (isNaN(id)) {
		throw createError({
			statusCode: 400,
			message: "Invalid form ID",
		});
	}

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

	return form;
});
