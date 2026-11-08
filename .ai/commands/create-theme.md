# Create New Theme

Create and register a form theme from the operator's description.

## Input

Use the text supplied with this command as the theme prompt (`$ARGUMENTS`), including any requested colors, specific elements, mood, typography, or light/dark appearance. For example:

```text
/create-theme Warm cream background, dark brown text, teal buttons, and orange focus rings
```

If no description was supplied, ask the operator for one before creating the theme. Preserve explicit color and element requests; choose a cohesive palette for unspecified details. If a request cannot be achieved with existing tokens, inspect the affected components and make the smallest appropriate change, following the project's Tailwind-only convention.

## Workflow

1. Inspect `app/types/themes.ts`, `public/assets/css/themes/form-fill-base.css`, `public/assets/css/themes/botulina-pink.css`, and relevant `app/components/form-fill/` components. Use `botulina-pink.css` as the proven starting point for every new theme. Check how the requested elements use colors and states before choosing tokens. Theme CSS is served directly to the browser, so write ordinary CSS, not Tailwind build directives such as `@apply` or `@theme`.
2. Choose a unique lowercase kebab-case ID, at most 50 characters, and a Hebrew title and description. Do not overwrite an existing theme. Select representative hex colors for the settings dropdown swatches.
3. Copy `public/assets/css/themes/botulina-pink.css` to `public/assets/css/themes/<id>.css`, then adapt the copy to the requested theme while preserving its working structure and coverage. Set the semantic tokens used by the fill view, including background/foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, and ring colors and their corresponding foreground colors where applicable. Set radius, font, or shadows if appropriate. Use valid CSS colors (existing themes commonly use `oklch`) and define a coherent theme rather than relying on unrelated defaults. Map requested element colors to the variables or existing component utilities that actually control them; check hover, focus, selected, disabled, and error states. Ensure text, controls, and focus indicators have sufficient contrast, including primary foreground against primary. The shared checkbox and radio icons are white, so account for that when choosing the primary color.
4. Add an entry to the `THEMES` array in `app/types/themes.ts`:

	```typescript
	{
		id: "your-theme-id",
		title: "שם בעברית",
		description: "תיאור בעברית",
		cssFile: "/assets/css/themes/your-theme-id.css",
		colors: ["#...", "#...", "#...", "#...", "#..."],
	},
	```

	Use real hex values for the swatches. `FormTheme` is derived from this array, and the form settings selector and theme endpoint use it. The database stores the ID in a varchar; registering a theme does not require a schema change or migration. Do not change existing theme IDs or defaults.
5. Verify the ID is unique, the CSS path matches the new file, the swatches reflect the palette, and the requested colors map to the intended elements. Check fill and print views and the settings selector visually if an already-running app and a suitable form are available; otherwise tell the operator what to verify. Run `pnpm run typecheck` when appropriate. Do not start the dev server or add tests without operator permission, and follow the repository's command restrictions.
6. Report the new theme ID, Hebrew title, key colors, files changed, and verification performed. Mention any visual checks that could not be performed.
