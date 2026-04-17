export const THEMES = [
	{
		id: "dark",
		title: "כהה",
		description: "עיצוב כהה לנוחות העיניים",
		cssFile: "/assets/css/themes/dark.css",
		colors: ["#111827", "#1f2937", "#374151", "#6b7280", "#9ca3af"],
	},
	{
		id: "ocean",
		title: "אוקיינוס",
		description: "גוונים כחולים ורגועים",
		cssFile: "/assets/css/themes/ocean.css",
		colors: ["#eff6ff", "#dbeafe", "#3b82f6", "#2563eb", "#1d4ed8"],
	},
	{
		id: "forest",
		title: "יער",
		description: "גוונים ירוקים ואדמה",
		cssFile: "/assets/css/themes/forest.css",
		colors: ["#fefce8", "#f0fdf4", "#86efac", "#22c55e", "#16a34a"],
	},
	{
		id: "unicorn",
		title: "חד קרן",
		description: "ורוד עז וקסום עם צללים",
		cssFile: "/assets/css/themes/unicorn.css",
		colors: ["#fdf2f8", "#fce7f3", "#f9a8d4", "#ec4899", "#db2777"],
	},
	{
		id: "orange",
		title: "תפוז",
		description: "גוונים כתומים עם פונט מונו",
		cssFile: "/assets/css/themes/orange.css",
		colors: ["#fff7ed", "#ffedd5", "#fdba74", "#f97316", "#ea580c"],
	},
	{
		id: "lightning",
		title: "ברק כחול",
		description: "עיצוב מודרני בגוונים כחולים",
		cssFile: "/assets/css/themes/lightning.css",
		colors: ["#eff6ff", "#bfdbfe", "#60a5fa", "#2563eb", "#1e40af"],
	},
	{
		id: "botulina-pink",
		title: "וורוד בוטולינה",
		description: "ורוד עז ובוטולינה",
		cssFile: "/assets/css/themes/botulina-pink.css",
		colors: ["#fdf2f8", "#fce7f3", "#f472b6", "#F1117F", "#be185d"],
	},
] as const;

export type Theme = (typeof THEMES)[number];
export type FormTheme = Theme["id"];
