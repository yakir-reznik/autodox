import { eq } from "drizzle-orm";
import { formsTable } from "~~/server/db/schema";
import { db } from "~~/server/db";

type H3Event = Parameters<typeof requireUserSession>[0];

export async function requireFormOwnerOrAdmin(event: H3Event, formId: number) {
	const session = await requireUserSession(event);
	const form = await db.query.formsTable.findFirst({ where: eq(formsTable.id, formId) });
	if (!form) throw createError({ statusCode: 404 });
	const isAdmin = session.user.role === "admin";
	if (!isAdmin && form.createdBy !== session.user.id) throw createError({ statusCode: 403 });
	return { session, form };
}
