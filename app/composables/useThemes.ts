import type { FormTheme } from "~/types/form-builder";

export interface ThemeDefinition {
	id: FormTheme;
	label: string;
	description: string;
	cssFile: string;
}

export const THEME_DEFINITIONS: ThemeDefinition[] = [
	{
		id: "default",
		label: "ברירת מחדל",
		description: "עיצוב קלאסי ונקי",
		cssFile: "/assets/css/themes/variables.css",
	},
	{
		id: "dark",
		label: "כהה",
		description: "עיצוב כהה לנוחות העיניים",
		cssFile: "/assets/css/themes/dark.css",
	},
	{
		id: "ocean",
		label: "אוקיינוס",
		description: "גוונים כחולים ורגועים",
		cssFile: "/assets/css/themes/ocean.css",
	},
	{
		id: "forest",
		label: "יער",
		description: "גוונים ירוקים ואדמה",
		cssFile: "/assets/css/themes/forest.css",
	},
	{
		id: "unicorn",
		label: "חד קרן",
		description: "ורוד עז וקסום עם צללים",
		cssFile: "/assets/css/themes/unicorn.css",
	},
];

export function getThemeDefinition(themeId: FormTheme): ThemeDefinition {
	return THEME_DEFINITIONS.find((t) => t.id === themeId) ?? THEME_DEFINITIONS[0]!;
}

export function getThemeOptionsForSelect() {
	return THEME_DEFINITIONS.map((theme) => ({
		label: theme.label,
		value: theme.id,
	}));
}
