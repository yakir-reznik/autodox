import { describe, expect, it } from "vitest";
import { themeColorKeys, validateTheme } from "../shared/types/themes";

const theme = { id: "custom-theme", title: "ערכה", description: "", baseCss: "/assets/css/themes/ocean.css", colors: Object.fromEntries(themeColorKeys.map((key) => [key, "#123456"])) };
describe("theme validation", () => {
	it("accepts a complete palette", () => expect(validateTheme(theme)).toBe(true));
	it("rejects invalid IDs and CSS injection", () => {
		expect(validateTheme({ ...theme, id: "../bad" })).toBe(false);
		expect(validateTheme({ ...theme, colors: { ...theme.colors, primary: "red; } body { display:none" } })).toBe(false);
	});
	it("validates a separate dark palette", () => {
		expect(validateTheme({ ...theme, darkColors: theme.colors })).toBe(true);
		expect(validateTheme({ ...theme, darkColors: { ...theme.colors, primary: "red; } body { display:none" } })).toBe(false);
	});
	it("requires every color", () => expect(validateTheme({ ...theme, colors: {} })).toBe(false));
});
