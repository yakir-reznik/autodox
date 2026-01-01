import { db } from "~~/server/db";
import { formsTable } from "~~/server/db/schema";
import { desc } from "drizzle-orm";

export default defineEventHandler(async () => {
	const forms = await db
		.select()
		.from(formsTable)
		.orderBy(desc(formsTable.updatedAt));

	return forms;
});
