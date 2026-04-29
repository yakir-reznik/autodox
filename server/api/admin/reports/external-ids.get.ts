import { db } from "~~/server/db";
import { submissionsTable } from "~~/server/db/schema";
import { isNotNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event);
	if (!session.user?.roles?.includes("admin")) {
		throw createError({ statusCode: 403, message: "Admin access required" });
	}

	return db
		.selectDistinct({ externalId: submissionsTable.externalId })
		.from(submissionsTable)
		.where(isNotNull(submissionsTable.externalId))
		.orderBy(submissionsTable.externalId);
});
