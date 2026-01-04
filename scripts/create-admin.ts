import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../server/db/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString("hex");
	const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
	return `${salt}:${derivedKey.toString("hex")}`;
}

async function createAdmin() {
	const connection = await mysql.createConnection(process.env.DATABASE_URL!);
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
					role: "admin"
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
