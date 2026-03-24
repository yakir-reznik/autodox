# How to Add New Fill Themes

This guide explains how to add a new theme to the form fill interface.

## Overview

Themes customize the appearance of forms when users fill them out. Each theme consists of CSS variables using the shadcn convention (oklch color format) that are dynamically loaded based on the form's theme setting.

## Steps to Add a New Theme

### 1. Create Theme CSS File

Create a new CSS file in `public/assets/css/themes/[theme-name].css`:

```css
@import url("https://fonts.googleapis.com/css2?family=Your+Font&display=swap");

:root {
	--background: oklch(0.98 0.002 250);
	--foreground: oklch(0.145 0.02 260);
	--card: oklch(1 0 0);
	--card-foreground: oklch(0.145 0.02 260);
	--popover: oklch(1 0 0);
	--popover-foreground: oklch(0.145 0.02 260);
	--primary: oklch(0.546 0.245 262.9);
	--primary-foreground: oklch(1 0 0);
	--secondary: oklch(0.97 0.003 260);
	--secondary-foreground: oklch(0.145 0.02 260);
	--muted: oklch(0.97 0.003 260);
	--muted-foreground: oklch(0.52 0.015 260);
	--accent: oklch(0.97 0.003 260);
	--accent-foreground: oklch(0.32 0.015 260);
	--destructive: oklch(0.637 0.237 25.3);
	--destructive-foreground: oklch(1 0 0);
	--border: oklch(0.87 0.005 260);
	--input: oklch(0.87 0.005 260);
	--ring: oklch(0.623 0.214 259);
	--radius: 0.5rem;
	--font-sans: "Your Font", sans-serif;
	--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
	/* Optional: chart, sidebar, shadow, spacing, tracking variables */
}

/* Optional: dark mode overrides */
.dark {
	--background: oklch(0.145 0 0);
	--foreground: oklch(0.97 0 0);
	/* ... */
}
```

**Available CSS Variables**: See `public/assets/css/themes/variables.css` for the default theme as a reference.

**Important**:
- Use oklch color format: `oklch(0.546 0.245 262.9)`
- Variables follow the shadcn naming convention (`--background`, `--primary`, `--card`, etc.)
- Import fonts via Google Fonts `@import url(...)` at the top of the file

### 2. Update Database Schema

Add your theme to the enum in `server/db/schema.ts`:

```typescript
export const formThemeEnum = ["default", "dark", "ocean", "forest", "unicorn", "orange", "your-theme"] as const;
```

### 3. Register Theme Definition

Add your theme to `app/composables/useThemes.ts`:

```typescript
export const THEME_DEFINITIONS: ThemeDefinition[] = [
	// ... existing themes
	{
		id: "your-theme",
		label: "תווית בעברית",  // Hebrew label for UI
		description: "תיאור הערכה",  // Hebrew description
		cssFile: "/assets/css/themes/your-theme.css",
	},
];
```

### 4. Generate and Run Migration

Generate a database migration to update the enum column:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

This updates the `forms_table.theme` column to include your new theme option.

## File Locations

```
public/assets/css/themes/
├── variables.css      # Default theme
├── dark.css           # Dark theme
├── ocean.css          # Ocean theme
├── unicorn.css        # Unicorn theme
├── orange.css         # Orange theme
└── your-theme.css     # Your new theme

server/db/schema.ts                  # Database schema (formThemeEnum)
app/composables/useThemes.ts         # Theme registry (THEME_DEFINITIONS)
server/api/forms/[id]/theme.css.get.ts  # API endpoint (auto-resolves via registry)
```

## How Theme Loading Works

The API endpoint `server/api/forms/[id]/theme.css.get.ts` reads the form's theme from the database, looks up the CSS file path from `useThemes.ts` via `getThemeDefinition()`, and redirects to the correct CSS file. No changes to the API endpoint are needed when adding a new theme.

## Testing Your Theme

1. Start the dev server: `pnpm dev`
2. Open a form in the editor: `/edit/[id]`
3. Select your theme from the "ערכת נושא" (Theme) dropdown
4. Save the form (auto-save or manual)
5. Navigate to the fill page: `/fill/[id]`
6. Verify your theme is applied

## CSS Variable Categories

### Colors (oklch format)
- `--background` / `--foreground`: Page background and text
- `--card` / `--card-foreground`: Card/container colors
- `--popover` / `--popover-foreground`: Popover colors
- `--primary` / `--primary-foreground`: Primary accent colors
- `--secondary` / `--secondary-foreground`: Secondary colors
- `--muted` / `--muted-foreground`: Muted/subdued colors
- `--accent` / `--accent-foreground`: Accent colors
- `--destructive` / `--destructive-foreground`: Error/danger colors
- `--border`: Border color
- `--input`: Input border color
- `--ring`: Focus ring color
- `--chart-1` through `--chart-5`: Chart colors
- `--sidebar-*`: Sidebar-specific colors

### Layout
- `--radius`: Border radius base value
- `--spacing`: Spacing base value
- `--shadow-*`: Box shadow styles (2xs, xs, sm, md, lg, xl, 2xl)

### Typography
- `--font-sans`: Sans-serif font stack
- `--font-serif`: Serif font stack
- `--font-mono`: Monospace font stack
- `--tracking-normal`: Letter spacing

## Tips

- **Consistency**: Use a cohesive color palette with clear contrast ratios for accessibility
- **Shadows**: Keep shadows subtle for professional themes; increase for playful themes
- **Border Radius**: Use `0rem` for sharp corners, `0.5rem` for modern, `9999px` for fully round
- **Testing**: Test with various form elements (inputs, buttons, sections) to ensure good coverage
- **RTL Support**: The app uses RTL (Right-to-Left) layout for Hebrew — no special CSS needed
- **Dark mode**: Optionally add a `.dark` selector block for dark mode overrides

## Existing Themes

- **Default**: Clean, classic design with purple accents (Rubik font)
- **Dark**: Dark backgrounds with light text for reduced eye strain
- **Ocean**: Blue color palette with calming tones (Rubik font)
- **Unicorn**: Bright pink, playful colors with round borders and pink shadows
- **Orange (תפוז)**: Warm orange tones with monospace font and no border radius
