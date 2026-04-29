import { and, eq } from "drizzle-orm";
import { formSharesTable } from "~~/server/db/schema";
import { requireFormPermission } from "~~/server/utils/authorization";
import type { FormSharePermissions } from "~~/app/types/form-builder";
import { db } from "~~/server/db";

export default defineEventHandler(async (event) => {
	const formId = Number(getRouterParam(event, "id"));
	const shareId = Number(getRouterParam(event, "shareId"));
	await requireFormPermission(event, formId, "manage_shares");

	const body = await readBody<{ permissions: FormSharePermissions }>(event);
	if (!body.permissions) {
		throw createError({ statusCode: 400, message: "permissions is required" });
	}

	const existing = await db.query.formSharesTable.findFirst({
		where: and(eq(formSharesTable.id, shareId), eq(formSharesTable.formId, formId)),
	});
	if (!existing) throw createError({ statusCode: 404 });

	await db
		.update(formSharesTable)
		.set({
			canViewSubmissions: body.permissions.canViewSubmissions,
			canCreateSubmissions: body.permissions.canCreateSubmissions,
			canManageSubmissions: body.permissions.canManageSubmissions,
			canEditForm: body.permissions.canEditForm,
		})
		.where(eq(formSharesTable.id, shareId));

	return { success: true };
});
