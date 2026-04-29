import { eq } from "drizzle-orm";
import { formSharesTable, usersTable } from "~~/server/db/schema";
import { requireFormPermission } from "~~/server/utils/authorization";
import { db } from "~~/server/db";

export default defineEventHandler(async (event) => {
	const formId = Number(getRouterParam(event, "id"));
	await requireFormPermission(event, formId, "manage_shares");

	const shares = await db
		.select({
			id: formSharesTable.id,
			formId: formSharesTable.formId,
			granteeUserId: formSharesTable.granteeUserId,
			granteeEmail: usersTable.email,
			granteeName: usersTable.name,
			grantedBy: formSharesTable.grantedBy,
			canViewSubmissions: formSharesTable.canViewSubmissions,
			canCreateSubmissions: formSharesTable.canCreateSubmissions,
			canManageSubmissions: formSharesTable.canManageSubmissions,
			canEditForm: formSharesTable.canEditForm,
			createdAt: formSharesTable.createdAt,
			updatedAt: formSharesTable.updatedAt,
		})
		.from(formSharesTable)
		.innerJoin(usersTable, eq(formSharesTable.granteeUserId, usersTable.id))
		.where(eq(formSharesTable.formId, formId));

	return shares.map((s) => ({
		id: s.id,
		formId: s.formId,
		granteeUserId: s.granteeUserId,
		granteeEmail: s.granteeEmail,
		granteeName: s.granteeName,
		grantedBy: s.grantedBy,
		permissions: {
			canViewSubmissions: s.canViewSubmissions,
			canCreateSubmissions: s.canCreateSubmissions,
			canManageSubmissions: s.canManageSubmissions,
			canEditForm: s.canEditForm,
		},
		createdAt: s.createdAt,
		updatedAt: s.updatedAt,
	}));
});
