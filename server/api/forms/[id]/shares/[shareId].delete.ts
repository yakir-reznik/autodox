import { and, eq } from "drizzle-orm";
import { formSharesTable } from "~~/server/db/schema";
import { requireFormOwnerOrAdmin } from "~~/server/utils/form-share-guard";
import { db } from "~~/server/db";

export default defineEventHandler(async (event) => {
	const formId = Number(getRouterParam(event, "id"));
	const shareId = Number(getRouterParam(event, "shareId"));
	await requireFormOwnerOrAdmin(event, formId);

	const existing = await db.query.formSharesTable.findFirst({
		where: and(eq(formSharesTable.id, shareId), eq(formSharesTable.formId, formId)),
	});
	if (!existing) throw createError({ statusCode: 404 });

	await db.delete(formSharesTable).where(eq(formSharesTable.id, shareId));

	return { success: true };
});
