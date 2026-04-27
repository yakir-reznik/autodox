import { db } from "~~/server/db";
import { formsTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";
import { requireFormPermission } from "~~/server/utils/authorization";

export default defineEventHandler(async (event) => {
	const id = Number(getRouterParam(event, "id"));

	if (isNaN(id)) {
		throw createError({ statusCode: 400, message: "Invalid form ID" });
	}

	await requireFormPermission(event, id, "delete");

	await db.delete(formsTable).where(eq(formsTable.id, id));

	return { success: true };
});
