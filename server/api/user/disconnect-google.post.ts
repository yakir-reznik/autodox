import { eq } from "drizzle-orm";
import { usersTable } from "~~/server/db/schema";
import { db } from "~~/server/db";

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event);
	if (!session.user) {
		throw createError({ statusCode: 401, message: "Authentication required" });
	}

	const users = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.id, session.user.id))
		.limit(1);

	const user = users[0];
	if (!user) {
		throw createError({ statusCode: 404, message: "User not found" });
	}

	if (!user.googleId) {
		throw createError({ statusCode: 400, message: "חשבון Google לא מחובר" });
	}

	// Block if user has no password — they'd be locked out
	if (!user.password) {
		throw createError({ statusCode: 400, message: "יש להגדיר סיסמה לפני ניתוק חשבון Google" });
	}

	await db
		.update(usersTable)
		.set({ googleId: null })
		.where(eq(usersTable.id, session.user.id));

	return { success: true };
});
