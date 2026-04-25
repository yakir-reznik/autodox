import type { UserRole } from "~~/server/db/schema"

type H3Event = Parameters<typeof requireUserSession>[0]

export async function getUserRole(event: H3Event): Promise<UserRole> {
	const session = await requireUserSession(event)
	return session.user.role
}

export async function hasUserRole(event: H3Event, role: UserRole): Promise<boolean> {
	const session = await getUserSession(event)
	return session.user?.role === role
}

export async function requireUserRole(event: H3Event, role: UserRole) {
	const session = await requireUserSession(event)
	if (session.user.role !== role) {
		throw createError({ statusCode: 403, message: "Forbidden" })
	}
	return session
}
