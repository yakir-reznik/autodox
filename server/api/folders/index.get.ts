import { db } from "~~/server/db";
import { foldersTable } from "~~/server/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireRoles } from "~~/server/utils/authorization";

export default defineEventHandler(async (event) => {
	const session = await requireRoles(event, ["user"]);
	const isAdmin = session.user.roles.includes("admin");

	const folders = await db
		.select()
		.from(foldersTable)
		.where(isAdmin ? undefined : eq(foldersTable.createdBy, session.user.id))
		.orderBy(asc(foldersTable.name));

	return folders;
});
