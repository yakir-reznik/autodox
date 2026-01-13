import { db } from "~~/server/db";
import { foldersTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const id = parseInt(getRouterParam(event, "id") || "0");

	if (!id) {
		throw createError({
			statusCode: 400,
			message: "Invalid folder ID",
		});
	}

	const body = await readBody(event);

	if (!body.name) {
		throw createError({
			statusCode: 400,
			message: "Name is required",
		});
	}

	// Update the folder
	await db
		.update(foldersTable)
		.set({
			name: body.name,
		})
		.where(eq(foldersTable.id, id));

	// Fetch the updated folder
	const folder = await db.query.foldersTable.findFirst({
		where: (folders, { eq }) => eq(folders.id, id),
	});

	if (!folder) {
		throw createError({
			statusCode: 404,
			message: "Folder not found",
		});
	}

	return folder;
});
