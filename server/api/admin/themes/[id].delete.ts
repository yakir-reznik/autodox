import { eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { formsTable, themesTable } from "~~/server/db/schema";
import { requireRoles } from "~~/server/utils/authorization";
import { getBuiltInThemes, getStoredTheme } from "~~/server/utils/themes";

export default defineEventHandler(async (event) => {
	await requireRoles(event, ["admin"]);
	const id = getRouterParam(event, "id") ?? "";
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 50) {
		throw createError({ statusCode: 400, message: "Invalid theme ID" });
	}
	if (id === "lightning" || id === "ocean") {
		throw createError({ statusCode: 409, message: "Default themes cannot be deleted" });
	}
	const stored = await getStoredTheme(id);
	if (stored?.isDeleted) throw createError({ statusCode: 404, message: "Theme not found" });
	const theme = stored ?? (await getBuiltInThemes()).find((item) => item.id === id);
	if (!theme) throw createError({ statusCode: 404, message: "Theme not found" });
	const used = await db.select({ id: formsTable.id }).from(formsTable).where(eq(formsTable.theme, id)).limit(1);
	if (used.length) throw createError({ statusCode: 409, message: "Theme is used by a form" });
	await db.insert(themesTable).values({
		id: theme.id,
		title: theme.title,
		description: theme.description,
		colors: theme.colors,
		darkColors: theme.darkColors ?? theme.colors,
		baseCss: theme.baseCss,
		isDeleted: true,
	}).onDuplicateKeyUpdate({ set: { isDeleted: true } });
	return { success: true };
});
