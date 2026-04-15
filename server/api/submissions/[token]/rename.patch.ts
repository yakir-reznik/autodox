import { eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { submissionsTable } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
	const token = getRouterParam(event, "token");
	if (!token) throw createError({ statusCode: 400, message: "Missing token" });

	const body = await readBody<{ name: string }>(event);
	if (typeof body?.name !== "string" || !body.name.trim()) {
		throw createError({ statusCode: 400, message: "Invalid name" });
	}

	const [submission] = await db
		.select({ id: submissionsTable.id })
		.from(submissionsTable)
		.where(eq(submissionsTable.token, token))
		.limit(1);

	if (!submission) throw createError({ statusCode: 404, message: "Submission not found" });

	await db
		.update(submissionsTable)
		.set({ name: body.name.trim() })
		.where(eq(submissionsTable.id, submission.id));

	return { success: true };
});
