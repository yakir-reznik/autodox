import { db } from "~~/server/db";
import { formsTable } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
	const session = await requireUserSession(event);
	const body = await readBody(event);

	if (!body.title) {
		throw createError({
			statusCode: 400,
			message: "Title is required",
		});
	}

	const result = await db.insert(formsTable).values({
		title: body.title,
		description: body.description || null,
		status: "draft",
		theme: body.theme || "lightning",
		createdBy: session.user.id,
		folderId: body.folderId || null,
	});

	const insertId = result[0].insertId;

	// Fetch the created form
	const form = await db.query.formsTable.findFirst({
		where: (forms, { eq }) => eq(forms.id, insertId),
	});

	return form;
});
