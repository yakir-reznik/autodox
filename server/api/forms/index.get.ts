import { db } from "~~/server/db";
import { formsTable } from "~~/server/db/schema";
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

	return db
		.select()
		.from(formsTable)
		.where(filter)
		.orderBy(desc(formsTable.updatedAt));
});
