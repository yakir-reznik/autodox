import { db } from "~~/server/db";
import { submissionsTable } from "~~/server/db/schema";
import { isNotNull } from "drizzle-orm";
import { requireRoles } from "~~/server/utils/authorization";

export default defineEventHandler(async (event) => {
	await requireRoles(event, ["admin"]);

	return db
		.selectDistinct({ externalId: submissionsTable.externalId })
		.from(submissionsTable)
		.where(isNotNull(submissionsTable.externalId))
		.orderBy(submissionsTable.externalId);
});
