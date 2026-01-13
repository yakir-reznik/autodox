import { db } from "~~/server/db";
import { foldersTable } from "~~/server/db/schema";
import { asc } from "drizzle-orm";

export default defineEventHandler(async () => {
	const folders = await db
		.select()
		.from(foldersTable)
		.orderBy(asc(foldersTable.name));

	return folders;
});
