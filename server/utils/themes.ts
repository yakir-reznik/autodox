import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { THEMES } from "~~/app/types/themes";
import { themeColorKeys, type EditableTheme, type ThemeColors } from "~~/shared/types/themes";
import { db } from "~~/server/db";
import { themesTable } from "~~/server/db/schema";

export async function getBuiltInThemes(): Promise<EditableTheme[]> {
	return Promise.all(THEMES.map(async (theme) => {
		const css = await readFile(join(process.cwd(), "public", theme.cssFile), "utf8")
			.catch(() => readFile(join(process.cwd(), ".output/public", theme.cssFile), "utf8"));
		const root = css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? "";
		const dark = css.match(/\.dark\s*\{([^}]*)\}/)?.[1];
		const colors = Object.fromEntries(themeColorKeys.map((key) => [key, root.match(new RegExp(`--${key}:\\s*([^;]+);`))?.[1]?.trim() ?? (key === "popover" ? "#ffffff" : "#171717")])) as ThemeColors;
		const darkOverrides = dark ? Object.fromEntries(themeColorKeys.flatMap((key) => {
			const value = dark.match(new RegExp(`--${key}:\\s*([^;]+);`))?.[1]?.trim();
			return value ? [[key, value]] : [];
		})) : {};
		const darkColors = { ...colors, ...darkOverrides };
		return { id: theme.id, title: theme.title, description: theme.description, colors, baseCss: theme.cssFile, darkColors };
	}));
}

export async function getThemes() {
	const [builtIn, stored] = await Promise.all([getBuiltInThemes(), db.select().from(themesTable)]);
	const byId = new Map<string, EditableTheme>(builtIn.map((theme) => [theme.id, theme]));
	for (const theme of stored) {
		if (theme.isDeleted) byId.delete(theme.id);
		else byId.set(theme.id, { ...theme, darkColors: theme.darkColors ?? theme.colors });
	}
	return [...byId.values()];
}

export async function getStoredTheme(id: string) {
	return (await db.select().from(themesTable).where(eq(themesTable.id, id)).limit(1))[0];
}

export function themeCss(theme: EditableTheme) {
	const declarations = (colors: ThemeColors) => themeColorKeys.map((key) => `\t--${key}: ${colors[key]};`).join("\n");
	return `@import url("${theme.baseCss}");\n:root {\n${declarations(theme.colors)}\n}\nhtml.dark {\n${declarations(theme.darkColors ?? theme.colors)}\n}`;
}
