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

	// Check if folder exists
	const folder = await db.query.foldersTable.findFirst({
		where: (folders, { eq }) => eq(folders.id, id),
	});

	if (!folder) {
		throw createError({
			statusCode: 404,
			message: "Folder not found",
		});
	}

	// Delete the folder (cascade will delete all forms in the folder)
	await db.delete(foldersTable).where(eq(foldersTable.id, id));

	return { success: true };
});
