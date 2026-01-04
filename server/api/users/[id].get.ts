import { db } from "~~/server/db";
import { usersTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const id = Number(getRouterParam(event, "id"));

	if (isNaN(id)) {
		throw createError({
			statusCode: 400,
			message: "Invalid user ID",
		});
	}

	const user = await db.query.usersTable.findFirst({
		where: eq(usersTable.id, id),
		columns: {
			id: true,
			name: true,
			email: true,
			role: true,
		},
	});

	if (!user) {
		throw createError({
			statusCode: 404,
			message: "User not found",
		});
	}

	return user;
});
