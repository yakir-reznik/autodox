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

	const body = await readBody(event);

	// Build update object with only provided fields
	const updates: Partial<{
		title: string;
		description: string;
		status: "draft" | "published" | "archived";
		theme: "default" | "dark" | "ocean" | "forest" | "unicorn";
		updatedBy: number;
	}> = {};

	if (body.title !== undefined) updates.title = body.title;
	if (body.description !== undefined) updates.description = body.description;
	if (body.status !== undefined) updates.status = body.status;
	if (body.theme !== undefined) updates.theme = body.theme;
	if (body.updatedBy !== undefined) updates.updatedBy = body.updatedBy;

	if (Object.keys(updates).length === 0) {
		throw createError({
			statusCode: 400,
			message: "No fields to update",
		});
	}

	await db.update(formsTable).set(updates).where(eq(formsTable.id, id));

	// Return updated form
	const form = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, id),
	});

	if (!form) {
		throw createError({
			statusCode: 404,
			message: "Form not found",
		});
	}

	return form;
});
