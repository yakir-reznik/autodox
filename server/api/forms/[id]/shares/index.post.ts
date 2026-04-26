import { and, eq } from "drizzle-orm";
import { formSharesTable, usersTable } from "~~/server/db/schema";
import { requireFormOwnerOrAdmin } from "~~/server/utils/form-share-guard";
import type { FormSharePermissions } from "~~/app/types/form-builder";
import { db } from "~~/server/db";

export default defineEventHandler(async (event) => {
	const formId = Number(getRouterParam(event, "id"));
	const { session, form } = await requireFormOwnerOrAdmin(event, formId);

	const body = await readBody<{ granteeUserId: number; permissions: FormSharePermissions }>(
		event,
	);

	if (!body.granteeUserId || !body.permissions) {
		throw createError({
			statusCode: 400,
			message: "granteeUserId and permissions are required",
		});
	}

	if (body.granteeUserId === form.createdBy) {
		throw createError({ statusCode: 400, message: "Cannot share with the form owner" });
	}

	if (body.granteeUserId === session.user.id) {
		throw createError({ statusCode: 400, message: "Cannot share with yourself" });
	}

	const grantee = await db.query.usersTable.findFirst({
		where: eq(usersTable.id, body.granteeUserId),
	});
	if (!grantee) throw createError({ statusCode: 404, message: "User not found" });

	try {
		await db.insert(formSharesTable).values({
			formId,
			granteeUserId: body.granteeUserId,
			grantedBy: session.user.id,
			canViewSubmissions: body.permissions.canViewSubmissions,
			canCreateSubmissions: body.permissions.canCreateSubmissions,
			canManageSubmissions: body.permissions.canManageSubmissions,
			canEditForm: body.permissions.canEditForm,
		});
	} catch (err: any) {
		if (err?.code === "ER_DUP_ENTRY") {
			throw createError({
				statusCode: 409,
				message: "User already has a share for this form",
			});
		}
		throw err;
	}

	const [inserted] = await db
		.select()
		.from(formSharesTable)
		.where(
			and(
				eq(formSharesTable.formId, formId),
				eq(formSharesTable.granteeUserId, body.granteeUserId),
			),
		)
		.limit(1);

	return {
		id: inserted.id,
		formId: inserted.formId,
		granteeUserId: inserted.granteeUserId,
		granteeEmail: grantee.email,
		granteeName: grantee.name,
		grantedBy: inserted.grantedBy,
		permissions: {
			canViewSubmissions: inserted.canViewSubmissions,
			canCreateSubmissions: inserted.canCreateSubmissions,
			canManageSubmissions: inserted.canManageSubmissions,
			canEditForm: inserted.canEditForm,
		},
		createdAt: inserted.createdAt,
		updatedAt: inserted.updatedAt,
	};
});
