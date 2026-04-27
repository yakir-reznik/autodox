import { eq, and } from "drizzle-orm"
import type { H3Event } from "h3"
import type { UserRole } from "~~/server/db/schema"
import { formsTable, formSharesTable, submissionsTable, usersTable } from "~~/server/db/schema"
import { db } from "~~/server/db"

export type FormPermission =
	| "view"
	| "view_submissions"
	| "create_submissions"
	| "manage_submissions"
	| "edit_form"
	| "delete"
	| "manage_shares"

const ALL_PERMISSIONS = new Set<FormPermission>([
	"view",
	"view_submissions",
	"create_submissions",
	"manage_submissions",
	"edit_form",
	"delete",
	"manage_shares",
])

export function expandRoles(role: UserRole): UserRole[] {
	return role === "admin" ? ["admin", "user"] : [role]
}

export async function requireRoles(event: H3Event, required: UserRole[]) {
	const session = await requireUserSession(event)
	const hasRole = required.some((r) => session.user.roles.includes(r))
	if (!hasRole) throw createError({ statusCode: 403, message: "Forbidden" })
	return session
}

export async function getUserRole(event: H3Event): Promise<UserRole> {
	const session = await requireUserSession(event)
	return session.user.roles.includes("admin") ? "admin" : (session.user.roles[0] as UserRole)
}

export async function hasUserRole(event: H3Event, role: UserRole): Promise<boolean> {
	const session = await getUserSession(event)
	return session.user?.roles.includes(role) ?? false
}

export async function getFormPermissions(
	userId: number,
	formId: number,
	isAdmin: boolean,
): Promise<Set<FormPermission>> {
	const form = await db.query.formsTable.findFirst({ where: eq(formsTable.id, formId) })
	if (!form) throw createError({ statusCode: 404, message: "Form not found" })

	if (isAdmin || form.createdBy === userId) return new Set(ALL_PERMISSIONS)

	const share = await db.query.formSharesTable.findFirst({
		where: and(
			eq(formSharesTable.formId, formId),
			eq(formSharesTable.granteeUserId, userId),
		),
	})

	if (!share) return new Set()

	const perms = new Set<FormPermission>(["view"])
	if (share.canViewSubmissions) perms.add("view_submissions")
	if (share.canCreateSubmissions) perms.add("create_submissions")
	if (share.canManageSubmissions) perms.add("manage_submissions")
	if (share.canEditForm) perms.add("edit_form")
	return perms
}

export async function requireFormPermission(
	event: H3Event,
	formId: number,
	perm: FormPermission,
) {
	const session = await requireUserSession(event)
	const isAdmin = session.user.roles.includes("admin")

	const form = await db.query.formsTable.findFirst({ where: eq(formsTable.id, formId) })
	if (!form) throw createError({ statusCode: 404, message: "Form not found" })

	const permissions = await getFormPermissions(session.user.id, formId, isAdmin)
	if (!permissions.has(perm)) throw createError({ statusCode: 403, message: "Forbidden" })

	return { session, form, permissions }
}

export async function requireSubmissionPermission(
	event: H3Event,
	token: string,
	perm: FormPermission,
) {
	const session = await requireUserSession(event)
	const isAdmin = session.user.roles.includes("admin")

	const submission = await db.query.submissionsTable.findFirst({
		where: eq(submissionsTable.token, token),
	})
	if (!submission) throw createError({ statusCode: 404, message: "Submission not found" })

	const form = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, submission.formId),
	})
	if (!form) throw createError({ statusCode: 404, message: "Form not found" })

	const permissions = await getFormPermissions(session.user.id, form.id, isAdmin)
	if (!permissions.has(perm)) throw createError({ statusCode: 403, message: "Forbidden" })

	return { session, submission, form, permissions }
}

export async function requireApiKeyFormPermission(
	event: H3Event,
	formId: number,
	perm: FormPermission,
) {
	const apiKey = getHeader(event, "x-api-key")
	if (!apiKey) throw createError({ statusCode: 401, message: "API key is required" })

	const user = await db.query.usersTable.findFirst({
		where: eq(usersTable.apiKey, apiKey),
	})
	if (!user) throw createError({ statusCode: 401, message: "Invalid API key" })

	const isAdmin = user.role === "admin"

	const form = await db.query.formsTable.findFirst({ where: eq(formsTable.id, formId) })
	if (!form) throw createError({ statusCode: 404, message: "Form not found" })

	const permissions = await getFormPermissions(user.id, formId, isAdmin)
	if (!permissions.has(perm)) throw createError({ statusCode: 403, message: "Forbidden" })

	return { user, form, permissions }
}
