import { eq } from "drizzle-orm";
import { usersTable } from "~~/server/db/schema";
import { db } from "~~/server/db";

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event);
	if (!session.user) {
		throw createError({ statusCode: 401, message: "Authentication required" });
	}

	const body = await readBody(event);
	const { name } = body;

	if (!name || typeof name !== "string" || name.trim().length === 0) {
		throw createError({ statusCode: 400, message: "שם תצוגה נדרש" });
	}

	const trimmedName = name.trim();

	await db
		.update(usersTable)
		.set({ name: trimmedName })
		.where(eq(usersTable.id, session.user.id));

	// Update session so client reflects the change
	await setUserSession(event, {
		user: {
			...session.user,
			name: trimmedName,
		},
	});

	return { success: true, name: trimmedName };
});
