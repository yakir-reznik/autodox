// Creates or updates an admin user in the database.
// Usage: pnpm exec tsx scripts/create-admin.ts [email] [password] [name]
// Example: pnpm exec tsx scripts/create-admin.ts admin@example.com mypassword "Admin User"
// Defaults: admin@example.com / admin123 / "Admin User"

import "dotenv/config";

import process from "node:process";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import { Hash } from "@adonisjs/hash";
import { Scrypt } from "@adonisjs/hash/drivers/scrypt";
import * as schema from "../server/db/schema";
import { generateApiKey } from "../server/utils/apiKey";

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

async function createAdmin() {
	const connection = await mysql.createConnection(getDatabaseUrl());
	const db = drizzle(connection, { schema, mode: "default" });

	// Get credentials from command line arguments or use defaults
	const args = process.argv.slice(2);
	const email = args[0] || "admin@example.com";
	const password = args[1] || "admin123";
	const name = args[2] || "Admin User";

	try {
		// Check if user with this email exists
		const existingUser = await db.query.usersTable.findFirst({
			where: eq(schema.usersTable.email, email),
		});

		// Hash the password
		const hashedPassword = await hashPassword(password);

		if (existingUser) {
			console.log(`User with email ${email} already exists. Updating password...`);

			// Update existing user's password
			await db
				.update(schema.usersTable)
				.set({
					password: hashedPassword,
					name: name,
					role: "admin",
				})
				.where(eq(schema.usersTable.email, email));

			console.log("Admin user updated successfully");
		} else {
			// Create new admin user
			await db.insert(schema.usersTable).values({
				name: name,
				email: email,
				password: hashedPassword,
				role: "admin",
				apiKey: generateApiKey(),
			});

			console.log("Admin user created successfully");
		}

		console.log("\nCredentials:");
		console.log(`Email: ${email}`);
		console.log(`Password: ${password}`);
		console.log(`Name: ${name}`);
	} catch (error) {
		console.error("Error creating/updating admin user:", error);
		await connection.end();
		process.exit(1);
	}

	await connection.end();
	process.exit(0);
}

createAdmin();
