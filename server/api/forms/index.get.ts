import { db } from "~~/server/db";
import { formsTable, foldersTable } from "~~/server/db/schema";
import { desc, eq, isNull, type SQL } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const { folderId } = getQuery(event);

	// Build filter based on folderId query parameter
	let filter: SQL | undefined;
	if (folderId === "null") {
		filter = isNull(formsTable.folderId);
	} else if (folderId !== undefined) {
		filter = eq(formsTable.folderId, parseInt(folderId as string));
	}

	const results = await db
		.select({
			id: formsTable.id,
			title: formsTable.title,
			description: formsTable.description,
			folderId: formsTable.folderId,
			status: formsTable.status,
			theme: formsTable.theme,
			webhookUrl: formsTable.webhookUrl,
			createdBy: formsTable.createdBy,
			updatedBy: formsTable.updatedBy,
			createdAt: formsTable.createdAt,
			updatedAt: formsTable.updatedAt,
			folderName: foldersTable.name,
		})
		.from(formsTable)
		.leftJoin(foldersTable, eq(formsTable.folderId, foldersTable.id))
		.where(filter)
		.orderBy(desc(formsTable.createdAt));

	return results;
});
