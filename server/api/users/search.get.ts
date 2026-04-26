import { and, eq, like, ne, or } from "drizzle-orm";
import { usersTable } from "~~/server/db/schema";
import { db } from "~~/server/db";

export default defineEventHandler(async (event) => {
	const session = await requireUserSession(event);
	const { q } = getQuery(event) as { q?: string };

	if (!q || q.trim().length < 1) return [];

	const pattern = `${q.trim()}%`;

	const results = await db
		.select({ id: usersTable.id, email: usersTable.email, name: usersTable.name })
		.from(usersTable)
		.where(
			and(
				ne(usersTable.id, session.user.id),
				or(like(usersTable.email, pattern), like(usersTable.name, pattern)),
			),
		)
		.limit(10);

	return results;
});
