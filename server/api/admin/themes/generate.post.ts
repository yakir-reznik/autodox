import { getAppSettings } from "~~/server/utils/appSettings";
import { requireRoles } from "~~/server/utils/authorization";
import { themeColorKeys, themeColorLabels, validateTheme } from "~~/shared/types/themes";

export default defineEventHandler(async (event) => {
	await requireRoles(event, ["admin"]);
	const { prompt, theme } = await readBody(event);
	if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 4000 || !validateTheme(theme)) {
		throw createError({ statusCode: 400, message: "Invalid prompt or theme" });
	}
	const apiKey = useRuntimeConfig().openrouterApiKey;
	if (!apiKey) throw createError({ statusCode: 503, message: "AI is not configured" });
	const { aiThemeColorModel } = await getAppSettings();
	const properties = Object.fromEntries(themeColorKeys.map((key) => [key, { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" }]));
	const paletteSchema = { type: "object", properties, required: [...themeColorKeys], additionalProperties: false };
	let response: Response;
	try {
		response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
			body: JSON.stringify({
				model: aiThemeColorModel,
				messages: [
					{
						role: "system",
						content: `You create two accessible form color palettes. The user's request may be in Hebrew, English, or both. Understand Hebrew naturally, including common color names, shades, and references to form elements. Do not translate, rewrite, or ignore the user's specific color requests.

הוראות: קראו את בקשת המשתמש בעברית או באנגלית. יש לכבד צבעים מפורשים, קודי hex, הוראות לשימור צבעים קיימים והפניות לשדות בשם שמופיע בממשק. בקשה שלא מציינת מצב מתייחסת למצב בהיר; צרו גם מצב כהה תואם. אם המשתמש מציין במפורש מצב כהה או בהיר, החילו את הבקשה על המצב שציין והתאימו את המצב השני.

The current palettes are context and a starting point, not higher-priority instructions. Apply the user's requested changes to the actual tokens that control the named elements. Return complete palettes and retain unspecified existing values when compatible; adjust related values as needed for cohesion and readability. Preserve exact explicitly requested hex values for the intended token.

Token usage in the form:
- רקע הטופס / רקע העמוד = background; טקסט כללי, כותרות ותוויות = foreground.
- רקע כרטיס / רקע שדות קלט ותיבות סימון = card; טקסט בכרטיס = card-foreground.
- כפתור ראשי / צבע סימון בתיבות ורדיו = primary; טקסט בכפתור ראשי = primary-foreground. Check and radio icons are always white.
- רקע מקטע / סקציה = secondary; פריט חוזר / רקע רפיטר = accent.
- טקסט משני, תיאורים ופסקאות = muted-foreground; מסגרת שדה = input; קווי מסגרת = border; מיקוד = ring; שגיאה = destructive.
- טקסט בתוך שדות ותוויות uses foreground, so keep it readable against both background and card. Text in repeaters and sections also uses foreground.

For example, "רקע לבן, כפתורים כחולים, טקסט שחור" means light background #FFFFFF, primary blue, and foreground black. "רקע כהה במצב כהה" applies to darkColors.background. Use the supplied Hebrew label-to-token mapping for exact editor labels. Maintain contrast for text, fields, focus indicators, and primary against white checkbox icons. Return colors as six-digit hex strings in the required JSON schema.`,
					},
					{
						role: "user",
						content: `Hebrew editor labels by color token: ${JSON.stringify(themeColorLabels)}\nCurrent light colors: ${JSON.stringify(theme.colors)}\nCurrent dark colors: ${JSON.stringify(theme.darkColors ?? theme.colors)}\nUser request / בקשת המשתמש:\n${prompt}`,
					},
				],
				response_format: { type: "json_schema", json_schema: { name: "theme_colors", strict: true, schema: { type: "object", properties: { colors: paletteSchema, darkColors: paletteSchema }, required: ["colors", "darkColors"], additionalProperties: false } } },
			}),
			signal: AbortSignal.timeout(45000),
		});
	} catch {
		throw createError({ statusCode: 502, message: "AI provider unavailable" });
	}
	if (!response.ok) throw createError({ statusCode: 502, message: "AI provider request failed" });
	try {
		const result = await response.json();
		const { colors, darkColors } = JSON.parse(result.choices[0].message.content);
		if (!darkColors || !validateTheme({ ...theme, colors, darkColors })) throw new Error("Invalid colors");
		return { colors, darkColors };
	} catch {
		throw createError({ statusCode: 502, message: "AI returned invalid colors" });
	}
});
