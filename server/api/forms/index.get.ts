import { db } from "~~/server/db";
import { formsTable, foldersTable, formSharesTable } from "~~/server/db/schema";
import { desc, eq, isNull, isNotNull, and, or, type SQL } from "drizzle-orm";
import { requireRoles } from "~~/server/utils/authorization";
import type { FormPermissions } from "~~/app/types/form-builder";

const ALL_PERMISSIONS: FormPermissions = {
	canView: true,
	canViewSubmissions: true,
	canCreateSubmissions: true,
	canManageSubmissions: true,
	canEditForm: true,
	canDelete: true,
	canManageShares: true,
};

export default defineEventHandler(async (event) => {
	const session = await requireRoles(event, ["user"]);
	const userId = session.user.id;
	const isAdmin = session.user.roles.includes("admin");

	const query = getQuery(event);
	const { folderId } = query;
	const sharedWithMeOnly = query["shared-with-me"] !== undefined;

	let folderFilter: SQL | undefined;
	if (folderId === "null") {
		folderFilter = isNull(formsTable.folderId);
	} else if (folderId !== undefined) {
		folderFilter = eq(formsTable.folderId, parseInt(folderId as string));
	}

	if (sharedWithMeOnly) {
		const sharedFilter = folderFilter
			? and(
					isNotNull(formSharesTable.granteeUserId),
					folderFilter,
					eq(formSharesTable.granteeUserId, userId),
				)
			: eq(formSharesTable.granteeUserId, userId);

		const rows = await db
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
				shareCanViewSubmissions: formSharesTable.canViewSubmissions,
				shareCanCreateSubmissions: formSharesTable.canCreateSubmissions,
				shareCanManageSubmissions: formSharesTable.canManageSubmissions,
				shareCanEditForm: formSharesTable.canEditForm,
			})
			.from(formsTable)
			.leftJoin(foldersTable, eq(formsTable.folderId, foldersTable.id))
			.innerJoin(
				formSharesTable,
				and(
					eq(formSharesTable.formId, formsTable.id),
					eq(formSharesTable.granteeUserId, userId),
				),
			)
			.where(sharedFilter)
			.orderBy(desc(formsTable.createdAt));

		return rows.map((row) => ({
			id: row.id,
			title: row.title,
			description: row.description,
			folderId: row.folderId,
			status: row.status,
			theme: row.theme,
			webhookUrl: row.webhookUrl,
			createdBy: row.createdBy,
			updatedBy: row.updatedBy,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			folderName: row.folderName,
			isOwner: false,
			permissions: {
				canView: true,
				canViewSubmissions: row.shareCanViewSubmissions ?? false,
				canCreateSubmissions: row.shareCanCreateSubmissions ?? false,
				canManageSubmissions: row.shareCanManageSubmissions ?? false,
				canEditForm: row.shareCanEditForm ?? false,
				canDelete: false,
				canManageShares: false,
			},
		}));
	}

	if (isAdmin) {
		const rows = await db
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
			.where(folderFilter)
			.orderBy(desc(formsTable.createdAt));

		return rows.map((row) => ({
			...row,
			isOwner: row.createdBy === userId,
			permissions: ALL_PERMISSIONS,
		}));
	}

	// For regular users: owned forms (with folder filter) ∪ shared forms
	const ownedFilter = folderFilter
		? and(eq(formsTable.createdBy, userId), folderFilter)
		: eq(formsTable.createdBy, userId);

	const rows = await db
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
			shareCanViewSubmissions: formSharesTable.canViewSubmissions,
			shareCanCreateSubmissions: formSharesTable.canCreateSubmissions,
			shareCanManageSubmissions: formSharesTable.canManageSubmissions,
			shareCanEditForm: formSharesTable.canEditForm,
			shareGranteeUserId: formSharesTable.granteeUserId,
		})
		.from(formsTable)
		.leftJoin(foldersTable, eq(formsTable.folderId, foldersTable.id))
		.leftJoin(
			formSharesTable,
			and(
				eq(formSharesTable.formId, formsTable.id),
				eq(formSharesTable.granteeUserId, userId),
			),
		)
		.where(or(ownedFilter, isNotNull(formSharesTable.granteeUserId)))
		.orderBy(desc(formsTable.createdAt));

	return rows.map((row) => {
		const isOwner = row.createdBy === userId;
		const permissions: FormPermissions = isOwner
			? ALL_PERMISSIONS
			: {
					canView: true,
					canViewSubmissions: row.shareCanViewSubmissions ?? false,
					canCreateSubmissions: row.shareCanCreateSubmissions ?? false,
					canManageSubmissions: row.shareCanManageSubmissions ?? false,
					canEditForm: row.shareCanEditForm ?? false,
					canDelete: false,
					canManageShares: false,
				};

		return {
			id: row.id,
			title: row.title,
			description: row.description,
			folderId: row.folderId,
			status: row.status,
			theme: row.theme,
			webhookUrl: row.webhookUrl,
			createdBy: row.createdBy,
			updatedBy: row.updatedBy,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			folderName: row.folderName,
			isOwner,
			permissions,
		};
	});
});
