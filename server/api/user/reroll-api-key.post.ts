import { eq } from "drizzle-orm";
import { usersTable } from "~~/server/db/schema";
import { db } from "~~/server/db";


export default defineEventHandler(async (event) => {
	const session = await requireUserSession(event);
	const newApiKey = generateApiKey();

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
