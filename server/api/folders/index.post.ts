import { db } from "~~/server/db";
import { foldersTable } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
	const body = await readBody(event);

	if (!body.name) {
		throw createError({
			statusCode: 400,
			message: "Name is required",
		});
	}

	if (!body.createdBy) {
		throw createError({
			statusCode: 400,
			message: "CreatedBy is required",
		});
	}

	const result = await db.insert(foldersTable).values({
		name: body.name,
		createdBy: body.createdBy,
	});

	const insertId = result[0].insertId;

	// Fetch the created folder
	const folder = await db.query.foldersTable.findFirst({
		where: (folders, { eq }) => eq(folders.id, insertId),
	});

	return folder;
});
