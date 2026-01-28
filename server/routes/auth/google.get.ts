import { eq } from "drizzle-orm";
import { usersTable } from "~~/server/db/schema";
import { db } from "~~/server/db";

export default defineOAuthGoogleEventHandler({
	config: {
		scope: ["email", "profile"],
	},
	async onSuccess(event, { user }) {
		const email = user.email;
		const name = user.name || user.email.split("@")[0];

		if (!email) {
			throw createError({
				statusCode: 400,
				statusMessage: "Google account has no email",
			});
		}

		// Check if user exists by email
		const existingUsers = await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.email, email))
			.limit(1);

		let dbUser = existingUsers[0];

		// Create new user if doesn't exist
		if (!dbUser) {
			const result = await db.insert(usersTable).values({
				email,
				name,
				role: "admin",
			});

			const newUsers = await db
				.select()
				.from(usersTable)
				.where(eq(usersTable.id, Number(result[0].insertId)))
				.limit(1);

			dbUser = newUsers[0];
		}

		if (!dbUser) {
			throw createError({
				statusCode: 500,
				statusMessage: "Failed to create user",
			});
		}

		// Set user session
		await setUserSession(event, {
			user: {
				id: dbUser.id,
				email: dbUser.email,
				name: dbUser.name,
				role: dbUser.role,
				apiKey: dbUser.apiKey ?? "",
			},
		});

		return sendRedirect(event, "/forms");
	},
	onError(event, error) {
		console.error("Google OAuth error:", error);
		return sendRedirect(event, "/login?error=google");
	},
});
