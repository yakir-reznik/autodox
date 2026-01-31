import { eq } from "drizzle-orm";
import { usersTable } from "~~/server/db/schema";
import { db } from "~~/server/db";

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event);
	if (!session.user) {
		throw createError({ statusCode: 401, message: "Authentication required" });
	}

	const body = await readBody(event);
	const { currentPassword, newPassword } = body;

	if (!newPassword || newPassword.length < 6) {
		throw createError({ statusCode: 400, message: "הסיסמה חייבת להכיל לפחות 6 תווים" });
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

	// If user already has a password, verify the current one
	if (user.password) {
		if (!currentPassword) {
			throw createError({ statusCode: 400, message: "סיסמה נוכחית נדרשת" });
		}
		const isValid = await verifyPassword(user.password, currentPassword);
		if (!isValid) {
			throw createError({ statusCode: 401, message: "סיסמה נוכחית שגויה" });
		}
	}

	const hashed = await hashPassword(newPassword);

	await db
		.update(usersTable)
		.set({ password: hashed })
		.where(eq(usersTable.id, session.user.id));

	return { success: true };
});
