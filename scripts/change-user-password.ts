// Changes an existing user's password.
// Usage: pnpm exec tsx scripts/change-user-password.ts [email] [password]
// Example: pnpm exec tsx scripts/change-user-password.ts user@example.com newpassword

import "dotenv/config";

import process from "node:process";
import { Hash } from "@adonisjs/hash";
import { Scrypt } from "@adonisjs/hash/drivers/scrypt";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../server/db/schema";

async function hashPassword(password: string): Promise<string> {
	const hash = new Hash(new Scrypt({}));
	return await hash.make(password);
}

function getDatabaseUrl(): string {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error("DATABASE_URL is required");
	}

	return databaseUrl;
}

function getArgs(): { email: string; password: string } {
	const [email, password] = process.argv.slice(2);

	if (!email || !password) {
		throw new Error("Usage: pnpm exec tsx scripts/change-user-password.ts [email] [password]");
	}

	if (password.length < 6) {
		throw new Error("Password must be at least 6 characters long");
	}

	return { email, password };
}

async function changeUserPassword() {
	const { email, password } = getArgs();
	const connection = await mysql.createConnection(getDatabaseUrl());
	const db = drizzle(connection, { schema, mode: "default" });

	try {
		const existingUser = await db.query.usersTable.findFirst({
			where: eq(schema.usersTable.email, email),
		});

		if (!existingUser) {
			throw new Error(`User not found: ${email}`);
		}

		const hashedPassword = await hashPassword(password);

		await db
			.update(schema.usersTable)
			.set({ password: hashedPassword })
			.where(eq(schema.usersTable.email, email));

		console.log(`Password updated for ${email}`);
	} finally {
		await connection.end();
	}
}

changeUserPassword().catch((error) => {
	console.error("Error changing user password:", error);
	process.exit(1);
});
