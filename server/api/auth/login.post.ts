import { eq } from "drizzle-orm";
import { usersTable } from "~~/server/db/schema";
import { db } from "~~/server/db";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function verifyPassword(storedPassword: string, suppliedPassword: string): Promise<boolean> {
	const [salt, hash] = storedPassword.split(":");
	const hashBuffer = Buffer.from(hash, "hex");
	const suppliedHashBuffer = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;
	return timingSafeEqual(hashBuffer, suppliedHashBuffer);
}

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const { email, password } = body;

	if (!email || !password) {
		throw createError({
			statusCode: 400,
			statusMessage: "Email and password are required",
		});
	}

	// Find user by email
	const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

	const user = users[0];

	if (!user || !user.password) {
		throw createError({
			statusCode: 401,
			statusMessage: "Invalid email or password",
		});
	}

	// Verify password
	const isValid = await verifyPassword(user.password, password);

	if (!isValid) {
		throw createError({
			statusCode: 401,
			statusMessage: "Invalid email or password",
		});
	}

	// Set user session
	await setUserSession(event, {
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
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
