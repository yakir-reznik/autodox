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
	const properties = Object.fromEntries(themeColorKeys.map((key) => [key, { type: "string" }]));
	const paletteSchema = { type: "object", properties, required: [...themeColorKeys], additionalProperties: false };
	let response: Response;
	try {
		response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
			body: JSON.stringify({
				model: aiThemeColorModel,
				messages: [{ role: "system", content: "Create two cohesive, accessible form color palettes: a light palette and a matching dark palette. Assume the user's requested colors and details describe the light palette unless they explicitly specify otherwise. Respect any explicit light or dark mode instructions and adapt the other palette to match. Return all CSS color tokens as six-digit hex colors. Text must contrast with its backgrounds, and primary must contrast with white checkbox icons. Return JSON only." },
					{ role: "user", content: `Hebrew editor labels by color token: ${JSON.stringify(themeColorLabels)}\nCurrent light colors: ${JSON.stringify(theme.colors)}\nCurrent dark colors: ${JSON.stringify(theme.darkColors ?? theme.colors)}\nRequest: ${prompt}` }],
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
