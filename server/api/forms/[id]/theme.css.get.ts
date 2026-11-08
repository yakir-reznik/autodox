import { db } from "~~/server/db";
import { formsTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";
import { getStoredTheme, themeCss } from "~~/server/utils/themes";
import { getThemeDefinition } from "~/composables/useThemes";

export default defineEventHandler(async (event) => {
	const id = Number(getRouterParam(event, "id"));

	if (isNaN(id)) {
		throw createError({ statusCode: 400, message: "Invalid form ID" });
	}

	const form = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, id),
		columns: { theme: true },
	});

	if (!form) {
		throw createError({ statusCode: 404, message: "Form not found" });
	}

	const stored = await getStoredTheme(form.theme);
	if (stored) {
		setHeader(event, "Content-Type", "text/css; charset=utf-8");
		setHeader(event, "Cache-Control", "no-store");
		return themeCss({ ...stored, darkColors: stored.darkColors ?? stored.colors });
	}

	const cssFile = getThemeDefinition(form.theme || "default").cssFile;

	return sendRedirect(event, cssFile, 302);
});
