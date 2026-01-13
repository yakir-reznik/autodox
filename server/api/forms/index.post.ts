import { db } from "~~/server/db";
import { formsTable } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
	const body = await readBody(event);

	if (!body.title) {
		throw createError({
			statusCode: 400,
			message: "Title is required",
		});
	}

	if (!body.createdBy) {
		throw createError({
			statusCode: 400,
			message: "CreatedBy is required",
		});
	}

	const result = await db.insert(formsTable).values({
		title: body.title,
		description: body.description || null,
		status: "draft",
		createdBy: body.createdBy,
		folderId: body.folderId || null,
	});

	const insertId = result[0].insertId;

	// Fetch the created form
	const form = await db.query.formsTable.findFirst({
		where: (forms, { eq }) => eq(forms.id, insertId),
	});

	return form;
});
