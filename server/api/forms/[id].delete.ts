import { db } from "~~/server/db";
import { formsTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const id = Number(getRouterParam(event, "id"));

	if (isNaN(id)) {
		throw createError({
			statusCode: 400,
			message: "Invalid form ID",
		});
	}

	// Check if form exists
	const form = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, id),
	});

	if (!form) {
		throw createError({
			statusCode: 404,
			message: "Form not found",
		});
	}

	// Delete form (elements will be cascade deleted)
	await db.delete(formsTable).where(eq(formsTable.id, id));

	return { success: true };
});
