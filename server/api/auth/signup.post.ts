import { eq } from "drizzle-orm";
import { usersTable } from "~~/server/db/schema";
import { db } from "~~/server/db";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString("hex");
	const hash = (await scryptAsync(password, salt, 64)) as Buffer;
	return `${salt}:${hash.toString("hex")}`;
}

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

	// Create user
	const [newUser] = await db
		.insert(usersTable)
		.values({
			name,
			email,
			password: hashedPassword,
			role: "admin",
		})
		.$returningId();

	// Set user session
	await setUserSession(event, {
		user: {
			id: newUser.id,
			email,
			name,
			role: "admin",
			apiKey: "",
		},
	});

	return {
		success: true,
		user: {
			id: newUser.id,
			email,
			name,
			role: "admin",
		},
	};
});
