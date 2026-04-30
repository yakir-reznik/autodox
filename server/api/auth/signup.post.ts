import { eq } from "drizzle-orm";
import { usersTable } from "~~/server/db/schema";
import { db } from "~~/server/db";

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const { name, email, password } = body;

	if (!name || !email || !password) {
		throw createError({
			statusCode: 400,
			statusMessage: "שם, אימייל וסיסמה נדרשים",
		});
	}

	if (password.length < 6) {
		throw createError({
			statusCode: 400,
			statusMessage: "הסיסמה חייבת להכיל לפחות 6 תווים",
		});
	}

	// Check if user already exists
	const existingUsers = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.email, email))
		.limit(1);

	if (existingUsers.length > 0) {
		throw createError({
			statusCode: 409,
			statusMessage: "משתמש עם אימייל זה כבר קיים",
		});
	}

	// Hash password
	const hashedPassword = await hashPassword(password);

	// Generate API key
	const apiKey = generateApiKey();

	// Create user
	const [newUser] = await db
		.insert(usersTable)
		.values({
			name,
			email,
			password: hashedPassword,
			role: "user",
			apiKey,
		})
		.$returningId();

	if (!newUser) {
		throw createError({
			statusCode: 500,
			statusMessage: "שגיאה ביצירת המשתמש",
		});
	}

	// Set user session
	await setUserSession(event, {
		user: {
			id: newUser!.id,
			email,
			name,
			roles: expandRoles("user"),
			apiKey,
		},
	});

	return {
		success: true,
		user: {
			id: newUser!.id,
			email,
			name,
			role: "user",
		},
	};
});
