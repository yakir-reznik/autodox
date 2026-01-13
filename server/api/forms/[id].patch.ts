import { db } from "~~/server/db";
import { formsTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";

const ALLOWED_FIELDS = ["title", "description", "status", "theme", "updatedBy", "folderId"] as const;

export default defineEventHandler(async (event) => {
	const id = Number(getRouterParam(event, "id"));
	if (isNaN(id)) {
		throw createError({ statusCode: 400, message: "Invalid form ID" });
	}

	const body = await readBody(event);

	// Pick only allowed fields that are present in the request
	const updates = Object.fromEntries(
		ALLOWED_FIELDS.filter((key) => key in body).map((key) => [key, body[key]]),
	);

	if (Object.keys(updates).length === 0) {
		throw createError({ statusCode: 400, message: "No fields to update" });
	}

	await db.update(formsTable).set(updates).where(eq(formsTable.id, id));

	const form = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, id),
	});

	if (!form) {
		throw createError({ statusCode: 404, message: "Form not found" });
	}

	return form;
});
