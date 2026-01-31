import { eq, count } from "drizzle-orm";
import { usersTable, formsTable, submissionsTable } from "~~/server/db/schema";
import { db } from "~~/server/db";

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event);
	if (!session.user) {
		throw createError({ statusCode: 401, message: "Authentication required" });
	}

	const userId = session.user.id;

	const [user, formCountResult, submissionCountResult] = await Promise.all([
		db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1),
		db.select({ count: count() }).from(formsTable).where(eq(formsTable.createdBy, userId)),
		db
			.select({ count: count() })
			.from(submissionsTable)
			.innerJoin(formsTable, eq(submissionsTable.formId, formsTable.id))
			.where(eq(formsTable.createdBy, userId)),
	]);

	const dbUser = user[0];
	if (!dbUser) {
		throw createError({ statusCode: 404, message: "User not found" });
	}

	return {
		id: dbUser.id,
		name: dbUser.name,
		email: dbUser.email,
		role: dbUser.role,
		apiKey: dbUser.apiKey,
		googleId: dbUser.googleId,
		hasPassword: !!dbUser.password,
		createdAt: dbUser.createdAt,
		lastLoginAt: dbUser.lastLoginAt,
		formCount: formCountResult[0]?.count ?? 0,
		submissionCount: submissionCountResult[0]?.count ?? 0,
	};
});
