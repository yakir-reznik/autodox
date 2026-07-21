import { db } from "~~/server/db";
import { formStatusEnum, formsTable, foldersTable, formSharesTable } from "~~/server/db/schema";
import { and, asc, countDistinct, desc, eq, isNotNull, isNull, like, or, type SQL } from "drizzle-orm";
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

type FormsSortBy = "title" | "folderName" | "status" | "createdAt" | "updatedAt";
type FormsSortDir = "asc" | "desc";

export default defineEventHandler(async (event) => {
	const session = await requireRoles(event, ["user"]);
	const userId = session.user.id;
	const userEmail = session.user.email.toLowerCase();
	const isAdmin = session.user.roles.includes("admin");
	const shareRecipientFilter = or(
		eq(formSharesTable.granteeUserId, userId),
		eq(formSharesTable.granteeEmail, userEmail),
	);

	const query = getQuery(event);
	const { folderId } = query;
	const sharedWithMeOnly = query["shared-with-me"] !== undefined;
	const search = typeof query.search === "string" ? query.search.trim() : "";
	const status = typeof query.status === "string" ? query.status : "";
	const statusFilter = formStatusEnum.includes(status as (typeof formStatusEnum)[number])
		? eq(formsTable.status, status as (typeof formStatusEnum)[number])
		: undefined;
	const sortBy = parseSortBy(query.sortBy);
	const sortDir = parseSortDir(query.sortDir);
	const orderBy = getOrderBy(sortBy, sortDir);
	const paginationRequested = query.page !== undefined || query.limit !== undefined;
	const page = Math.max(1, Number(query.page) || 1);
	const limit = Math.min(100, Math.max(1, Number(query.limit) || 12));
	const offset = (page - 1) * limit;

	let folderFilter: SQL | undefined;
	if (folderId === "null") {
		folderFilter = isNull(formsTable.folderId);
	} else if (folderId !== undefined) {
		folderFilter = eq(formsTable.folderId, parseInt(folderId as string));
	}

	const searchFilter = getSearchFilter(search);

	if (sharedWithMeOnly) {
		const where = compactAnd([shareRecipientFilter, folderFilter, searchFilter, statusFilter]);
		const countWhere = compactAnd([shareRecipientFilter, folderFilter, searchFilter, statusFilter]);

		const rowsQuery = db
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
					shareRecipientFilter,
				),
			);

		const rowsPromise = paginationRequested
			? rowsQuery.where(where).orderBy(orderBy).limit(limit).offset(offset)
			: rowsQuery.where(where).orderBy(orderBy);

		const countPromise = paginationRequested
			? db
					.select({ count: countDistinct(formsTable.id) })
					.from(formsTable)
					.leftJoin(foldersTable, eq(formsTable.folderId, foldersTable.id))
					.innerJoin(
						formSharesTable,
						and(
							eq(formSharesTable.formId, formsTable.id),
							shareRecipientFilter,
						),
					)
					.where(countWhere)
			: Promise.resolve([{ count: 0 }]);

		const folderCountsPromise = paginationRequested
			? getSharedFolderCounts(shareRecipientFilter)
			: Promise.resolve([]);

		const [rows, totalResult, folderCounts] = await Promise.all([
			rowsPromise,
			countPromise,
			folderCountsPromise,
		]);

		const data = rows.map((row) => ({
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

		return paginationRequested
			? paginated(data, totalResult[0]?.count ?? 0, page, limit, folderCounts)
			: data;
	}

	if (isAdmin) {
		const where = compactAnd([folderFilter, searchFilter, statusFilter]);
		const rowsQuery = db
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
			.leftJoin(foldersTable, eq(formsTable.folderId, foldersTable.id));

		const rowsPromise = paginationRequested
			? rowsQuery.where(where).orderBy(orderBy).limit(limit).offset(offset)
			: rowsQuery.where(where).orderBy(orderBy);

		const countPromise = paginationRequested
			? db
					.select({ count: countDistinct(formsTable.id) })
					.from(formsTable)
					.leftJoin(foldersTable, eq(formsTable.folderId, foldersTable.id))
					.where(where)
			: Promise.resolve([{ count: 0 }]);

		const folderCountsPromise = paginationRequested
			? getAdminFolderCounts()
			: Promise.resolve([]);

		const [rows, totalResult, folderCounts] = await Promise.all([
			rowsPromise,
			countPromise,
			folderCountsPromise,
		]);

		const data = rows.map((row) => ({
			...row,
			isOwner: row.createdBy === userId,
			permissions: ALL_PERMISSIONS,
		}));

		return paginationRequested
			? paginated(data, totalResult[0]?.count ?? 0, page, limit, folderCounts)
			: data;
	}

	// For regular users: owned forms (with folder filter) ∪ shared forms
	const accessFilter = or(eq(formsTable.createdBy, userId), isNotNull(formSharesTable.id));
	const where = compactAnd([accessFilter, folderFilter, searchFilter, statusFilter]);

	const rowsQuery = db
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
		.leftJoin(
			formSharesTable,
			and(
				eq(formSharesTable.formId, formsTable.id),
				shareRecipientFilter,
			),
		);

	const rowsPromise = paginationRequested
		? rowsQuery.where(where).orderBy(orderBy).limit(limit).offset(offset)
		: rowsQuery.where(where).orderBy(orderBy);

	const countPromise = paginationRequested
		? db
				.select({ count: countDistinct(formsTable.id) })
				.from(formsTable)
				.leftJoin(foldersTable, eq(formsTable.folderId, foldersTable.id))
				.leftJoin(
					formSharesTable,
					and(
						eq(formSharesTable.formId, formsTable.id),
						shareRecipientFilter,
					),
				)
				.where(where)
		: Promise.resolve([{ count: 0 }]);

	const folderCountsPromise = paginationRequested
		? getUserFolderCounts(userId, shareRecipientFilter)
		: Promise.resolve([]);

	const [rows, totalResult, folderCounts] = await Promise.all([
		rowsPromise,
		countPromise,
		folderCountsPromise,
	]);

	const data = rows.map((row) => {
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

	return paginationRequested
		? paginated(data, totalResult[0]?.count ?? 0, page, limit, folderCounts)
		: data;
});

function getSearchFilter(search: string) {
	if (!search) return undefined;

	const conditions: SQL[] = [
		like(formsTable.title, `%${search}%`),
	];

	return or(...conditions);
}

function parseSortBy(value: unknown): FormsSortBy {
	const allowedFields: FormsSortBy[] = ["title", "folderName", "status", "createdAt", "updatedAt"];
	return allowedFields.includes(value as FormsSortBy) ? (value as FormsSortBy) : "createdAt";
}

function parseSortDir(value: unknown): FormsSortDir {
	return value === "asc" ? "asc" : "desc";
}

function getOrderBy(sortBy: FormsSortBy, sortDir: FormsSortDir) {
	const direction = sortDir === "asc" ? asc : desc;

	if (sortBy === "title") return direction(formsTable.title);
	if (sortBy === "folderName") return direction(foldersTable.name);
	if (sortBy === "status") return direction(formsTable.status);
	if (sortBy === "updatedAt") return direction(formsTable.updatedAt);
	return direction(formsTable.createdAt);
}

function compactAnd(conditions: (SQL | undefined)[]) {
	const activeConditions = conditions.filter(Boolean) as SQL[];
	if (activeConditions.length === 0) return undefined;
	return and(...activeConditions);
}

async function getAdminFolderCounts() {
	return db
		.select({
			folderId: formsTable.folderId,
			count: countDistinct(formsTable.id),
		})
		.from(formsTable)
		.groupBy(formsTable.folderId);
}

async function getSharedFolderCounts(shareRecipientFilter: SQL | undefined) {
	return db
		.select({
			folderId: formsTable.folderId,
			count: countDistinct(formsTable.id),
		})
		.from(formsTable)
		.innerJoin(
			formSharesTable,
			and(
				eq(formSharesTable.formId, formsTable.id),
				shareRecipientFilter,
			),
		)
		.groupBy(formsTable.folderId);
}

async function getUserFolderCounts(userId: number, shareRecipientFilter: SQL | undefined) {
	return db
		.select({
			folderId: formsTable.folderId,
			count: countDistinct(formsTable.id),
		})
		.from(formsTable)
		.leftJoin(
			formSharesTable,
			and(
				eq(formSharesTable.formId, formsTable.id),
				shareRecipientFilter,
			),
		)
		.where(or(eq(formsTable.createdBy, userId), isNotNull(formSharesTable.id)))
		.groupBy(formsTable.folderId);
}

function paginated<T>(
	data: T[],
	total: number,
	page: number,
	limit: number,
	folderCounts: { folderId: number | null; count: number }[],
) {
	const totalPages = Math.ceil(total / limit);
	return {
		data,
		pagination: {
			page,
			limit,
			total,
			totalPages,
			hasNextPage: page < totalPages,
			hasPreviousPage: page > 1,
		},
		folderCounts,
	};
}
