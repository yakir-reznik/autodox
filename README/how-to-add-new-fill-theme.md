# How to Add New Fill Themes

This guide explains how to add a new theme to the form fill interface.

## Overview

Themes customize the appearance of forms when users fill them out. Each theme consists of CSS variables for colors, spacing, borders, and shadows that are dynamically loaded based on the form's theme setting.

## Steps to Add a New Theme

### 1. Create Theme CSS File

Create a new CSS file in `public/assets/css/themes/[theme-name].css`:

```css
:root {
  /* Color palette - Use RGB values (space-separated, no rgb()) */
  --color-primary-500: 59 130 246;
  --color-neutral-50: 249 250 251;
  /* ... more colors */

  /* Form Fill Tokens */
  --fill-bg: 249 250 251;
  --fill-card-bg: 255 255 255;
  --fill-text-primary: 17 24 39;
  --fill-input-border: 209 213 219;
  --fill-button-primary-bg: 37 99 235;
  /* ... more tokens */

  /* Border Radius */
  --fill-radius-sm: 0.25rem;
  --fill-radius-md: 0.5rem;
  --fill-radius-lg: 0.75rem;

  /* Shadows */
  --fill-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --fill-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
```

**Available CSS Variables**: See `public/assets/css/themes/variables.css` for the complete list of customizable tokens.

**Important**:
- Use RGB format with spaces: `59 130 246` not `rgb(59, 130, 246)`
- This format enables Tailwind's alpha utilities (e.g., `bg-primary/50`)

### 2. Update Database Schema

Add your theme to the enum in `server/db/schema.ts`:

```typescript
export const formThemeEnum = ["default", "dark", "ocean", "forest", "your-theme"] as const;
```

### 3. Update API Type

Add the theme to the PATCH endpoint in `server/api/forms/[id].patch.ts`:

```typescript
const updates: Partial<{
  // ...
  theme: "default" | "dark" | "ocean" | "forest" | "your-theme";
  // ...
}> = {};
```

### 4. Register Theme Definition

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

### 5. Generate and Run Migration

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
├── dark.css          # Dark theme
├── ocean.css         # Ocean theme
├── forest.css        # Forest theme
└── your-theme.css    # Your new theme

server/db/schema.ts                  # Database schema
server/api/forms/[id].patch.ts       # API endpoint
app/composables/useThemes.ts         # Theme registry
```

## Testing Your Theme

1. Start the dev server: `pnpm dev`
2. Open a form in the editor: `/edit/[id]`
3. Select your theme from the "ערכת נושא" (Theme) dropdown
4. Save the form (auto-save or manual)
5. Navigate to the fill page: `/fill/[id]`
6. Verify your theme is applied

## CSS Variable Categories

### Colors
- `--color-primary-*`: Primary/accent colors
- `--color-neutral-*`: Gray scale
- `--fill-bg`: Page background
- `--fill-card-bg`: Card/container background
- `--fill-text-*`: Text colors
- `--fill-input-*`: Input field colors
- `--fill-button-*`: Button colors

### Layout
- `--fill-radius-*`: Border radius values
- `--fill-shadow-*`: Box shadow styles
- `--fill-spacing-*`: Spacing scale

### Typography
- `--fill-font-size-*`: Font size scale
- `--fill-font-family`: Font stack

## Tips

- **Consistency**: Use a cohesive color palette with clear contrast ratios for accessibility
- **Shadows**: Keep shadows subtle for professional themes; increase for playful themes
- **Border Radius**: Use `9999px` for completely round corners, or stick to `0.25rem-0.75rem` for modern designs
- **Testing**: Test with various form elements (inputs, buttons, sections) to ensure good coverage
- **RTL Support**: The app uses RTL (Right-to-Left) layout for Hebrew - no special CSS needed

## Example Themes

- **Default**: Clean, classic design with blue accents
- **Dark**: Dark backgrounds with light text for reduced eye strain
- **Ocean**: Blue color palette with calming tones
- **Forest**: Green and earth tones
- **Unicorn**: Bright pink, girly colors with round borders and pink shadows
