import { db } from "~~/server/db";
import { foldersTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";
import { requireRoles } from "~~/server/utils/authorization";

export default defineEventHandler(async (event) => {
	const session = await requireRoles(event, ["user"]);
	const id = parseInt(getRouterParam(event, "id") || "0");

	if (!id) {
		throw createError({ statusCode: 400, message: "Invalid folder ID" });
	}

	const folder = await db.query.foldersTable.findFirst({
		where: (t, { eq }) => eq(t.id, id),
	});

	if (!folder) {
		throw createError({ statusCode: 404, message: "Folder not found" });
	}

	const isAdmin = session.user.roles.includes("admin");
	if (!isAdmin && folder.createdBy !== session.user.id) {
		throw createError({ statusCode: 403, message: "Forbidden" });
	}

	await db.delete(foldersTable).where(eq(foldersTable.id, id));

	return { success: true };
});
