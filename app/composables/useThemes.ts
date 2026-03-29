import { THEMES } from "~/types/themes";
import type { Theme, FormTheme } from "~/types/themes";

export { THEMES };
export type { Theme, FormTheme };

export function getThemeDefinition(themeId: string): Theme {
	return THEMES.find((t) => t.id === themeId) ?? THEMES.find((t) => t.id === "ocean")!;
}

export function getThemeOptionsForSelect() {
	return THEMES.map((theme) => ({
		label: theme.title,
		value: theme.id,
	}));
}
