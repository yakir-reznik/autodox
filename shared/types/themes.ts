export const themeColorKeys = [
	"background", "foreground", "card", "card-foreground", "popover", "popover-foreground",
	"primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground",
	"accent", "accent-foreground", "destructive", "destructive-foreground", "border", "input", "ring",
] as const;

export const themeColorLabels: Record<(typeof themeColorKeys)[number], string> = {
	background: "רקע",
	foreground: "טקסט",
	card: "רקע כרטיס",
	"card-foreground": "טקסט בכרטיס",
	popover: "רקע חלונית",
	"popover-foreground": "טקסט בחלונית",
	primary: "צבע ראשי",
	"primary-foreground": "טקסט בצבע ראשי",
	secondary: "צבע משני",
	"secondary-foreground": "טקסט בצבע משני",
	muted: "רקע מעומעם",
	"muted-foreground": "טקסט מעומעם",
	accent: "הדגשה",
	"accent-foreground": "טקסט בהדגשה",
	destructive: "שגיאה",
	"destructive-foreground": "טקסט בשגיאה",
	border: "מסגרת",
	input: "מסגרת שדה",
	ring: "מסגרת מיקוד",
};

export type ThemeColors = Record<(typeof themeColorKeys)[number], string>;
export type EditableTheme = { id: string; title: string; description: string; colors: ThemeColors; baseCss: string; darkColors?: ThemeColors };

export function validateTheme(value: unknown): value is EditableTheme {
	if (!value || typeof value !== "object") return false;
	const theme = value as EditableTheme;
	return typeof theme.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(theme.id) && theme.id.length <= 50
		&& typeof theme.title === "string" && theme.title.trim().length > 0 && theme.title.length <= 255
		&& typeof theme.description === "string" && theme.description.length <= 1000
		&& typeof theme.baseCss === "string" && /^\/assets\/css\/themes\/[a-z0-9-]+\.css$/.test(theme.baseCss)
		&& validColors(theme.colors)
		&& (theme.darkColors === undefined || validColors(theme.darkColors));
}

function validColors(colors: ThemeColors) {
	return !!colors && themeColorKeys.every((key) => typeof colors[key] === "string"
		&& /^(#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})|oklch\([\d.\s%/+-]+\))$/i.test(colors[key]));
}
