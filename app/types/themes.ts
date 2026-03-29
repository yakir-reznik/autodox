export const THEMES = [
	{
		id: "dark",
		title: "כהה",
		description: "עיצוב כהה לנוחות העיניים",
		cssFile: "/assets/css/themes/dark.css",
	},
	{
		id: "ocean",
		title: "אוקיינוס",
		description: "גוונים כחולים ורגועים",
		cssFile: "/assets/css/themes/ocean.css",
	},
	{
		id: "forest",
		title: "יער",
		description: "גוונים ירוקים ואדמה",
		cssFile: "/assets/css/themes/forest.css",
	},
	{
		id: "unicorn",
		title: "חד קרן",
		description: "ורוד עז וקסום עם צללים",
		cssFile: "/assets/css/themes/unicorn.css",
	},
	{
		id: "orange",
		title: "תפוז",
		description: "גוונים כתומים עם פונט מונו",
		cssFile: "/assets/css/themes/orange.css",
	},
	{
		id: "lightning",
		title: "ברק כחול",
		description: "עיצוב מודרני בגוונים כחולים",
		cssFile: "/assets/css/themes/lightning.css",
	},
] as const;

export type Theme = (typeof THEMES)[number];
export type FormTheme = Theme["id"];
