import { eq } from "drizzle-orm";
import { usersTable } from "~~/server/db/schema";
import { db } from "~~/server/db";

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const { email, password } = body;

	if (!email || !password) {
		throw createError({
			statusCode: 400,
			statusMessage: "שם משתמש או סיסמה חסרים",
		});
	}

	// Find user by email
	const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

	const user = users[0];

	if (!user || !user.password) {
		throw createError({
			statusCode: 401,
			statusMessage: "שם משתמש או סיסמה שגויים",
		});
	}

	// Verify password
	const isValid = await verifyPassword(user.password, password);

	if (!isValid) {
		throw createError({
			statusCode: 401,
			statusMessage: "שם משתמש או סיסמה שגויים",
		});
	}

	// Update last login timestamp
	await db.update(usersTable).set({ lastLoginAt: new Date() }).where(eq(usersTable.id, user.id));

	// Set user session
	await setUserSession(event, {
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
			roles: expandRoles(user.role),
			apiKey: user.apiKey ?? "",
		},
	});

	return {
		success: true,
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
		},
	};
});
