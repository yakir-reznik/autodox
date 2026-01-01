import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../server/db/schema";
import { eq } from "drizzle-orm";

async function createAdmin() {
	const connection = await mysql.createConnection(process.env.DATABASE_URL!);
	const db = drizzle(connection, { schema, mode: "default" });

	try {
		// Check if admin user exists
		const existingAdmin = await db.query.usersTable.findFirst({
			where: eq(schema.usersTable.id, 1),
		});

		if (existingAdmin) {
			console.log("Admin user already exists:", existingAdmin);
			await connection.end();
			return;
		}

		// Create admin user
		await db.insert(schema.usersTable).values({
			name: "Admin User",
			email: "admin@example.com",
			role: "admin",
		});

		console.log("Admin user created successfully");
	} catch (error) {
		console.error("Error creating admin user:", error);
		await connection.end();
		process.exit(1);
	}

	await connection.end();
	process.exit(0);
}

createAdmin();
