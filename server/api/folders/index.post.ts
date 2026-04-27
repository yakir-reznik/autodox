import { db } from "~~/server/db";
import { foldersTable } from "~~/server/db/schema";
import { requireRoles } from "~~/server/utils/authorization";

export default defineEventHandler(async (event) => {
	const session = await requireRoles(event, ["user"]);
	const body = await readBody(event);

	if (!body.name) {
		throw createError({ statusCode: 400, message: "Name is required" });
	}

	const result = await db.insert(foldersTable).values({
		name: body.name,
		createdBy: session.user.id,
	});

	const folder = await db.query.foldersTable.findFirst({
		where: (t, { eq }) => eq(t.id, result[0].insertId),
	});

	return folder;
});
