import { THEMES } from "~~/app/types/themes";
import { validateTheme } from "~~/shared/types/themes";
import { db } from "~~/server/db";
import { themesTable } from "~~/server/db/schema";
import { requireRoles } from "~~/server/utils/authorization";
import { getStoredTheme } from "~~/server/utils/themes";

export default defineEventHandler(async (event) => {
	await requireRoles(event, ["admin"]);
	const body = await readBody(event);
	const create = body?.create === true;
	if (!validateTheme(body) || !THEMES.some((theme) => theme.cssFile === body.baseCss)) throw createError({ statusCode: 400, message: "Invalid theme" });
	const existing = await getStoredTheme(body.id);
	const builtIn = THEMES.find((theme) => theme.id === body.id);
	if (existing?.isDeleted) throw createError({ statusCode: 409, message: "Theme ID is unavailable" });
	if (builtIn && body.baseCss !== builtIn.cssFile) throw createError({ statusCode: 400, message: "Invalid base theme" });
	if (create && (existing || builtIn || body.id === "default")) throw createError({ statusCode: 409, message: "Theme ID already exists" });
	if (!create && !existing && !builtIn) throw createError({ statusCode: 404, message: "Theme not found" });
	const theme = { id: body.id, title: body.title.trim(), description: body.description.trim(), colors: body.colors, darkColors: body.darkColors ?? body.colors, baseCss: body.baseCss };
	if (create) {
		try { await db.insert(themesTable).values(theme); }
		catch (error: any) {
			if (error?.code === "ER_DUP_ENTRY") throw createError({ statusCode: 409, message: "Theme ID already exists" });
			throw error;
		}
	} else {
		await db.insert(themesTable).values(theme).onDuplicateKeyUpdate({ set: theme });
	}
	return theme;
});
