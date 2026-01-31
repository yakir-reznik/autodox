import { eq } from "drizzle-orm";
import { usersTable } from "~~/server/db/schema";
import { db } from "~~/server/db";
import { randomBytes } from "crypto";

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event);
	if (!session.user) {
		throw createError({ statusCode: 401, message: "Authentication required" });
	}

	const newApiKey = randomBytes(32).toString("hex");

	await db
		.update(usersTable)
		.set({ apiKey: newApiKey })
		.where(eq(usersTable.id, session.user.id));

	// Update session so client reflects the change
	await setUserSession(event, {
		user: {
			...session.user,
			apiKey: newApiKey,
		},
	});

	return { success: true, apiKey: newApiKey };
});
