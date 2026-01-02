# How to Theme the Form Fill Interface

This guide explains how the theme system works for the form fill interface and how to customize it.

## Theme Files

**Main theme variables:** `/app/assets/css/themes/variables.css`
This file contains all the CSS custom properties (CSS variables) that control the styling of the form fill interface.

**Theme application:** `/app/assets/css/main.css`
This file imports the theme variables and applies them to all form-fill component classes.

## Theme Structure

The theme is organized into several categories:

### 1. Color Palette

Base colors that are used throughout the theme:

- **Primary colors** (blue shades for accents and interactive elements)
  - `--color-primary-50` through `--color-primary-700`
- **Neutral/gray colors** (for backgrounds, text, borders)
  - `--color-neutral-50` through `--color-neutral-900`
- **Semantic colors** (success and error states)
  - `--color-success-500`, `--color-success-100`
  - `--color-error-500`, `--color-error-100`

### 2. Form Fill Tokens

These tokens map the base colors to specific UI elements:

**Backgrounds:**
- `--fill-bg` - Page background color
- `--fill-card-bg` - Form card background
- `--fill-section-bg` - Section background color

**Text colors:**
- `--fill-text-primary` - Main text color
- `--fill-text-secondary` - Secondary text (descriptions)
- `--fill-text-muted` - Muted text (captions)
- `--fill-text-placeholder` - Input placeholder text

**Form elements:**
- `--fill-label-color` - Form field labels
- `--fill-input-bg` - Input background
- `--fill-input-border` - Input border color
- `--fill-input-border-focus` - Input border when focused
- `--fill-input-text` - Input text color
- `--fill-required-color` - Required field indicator (*)
- `--fill-help-text-color` - Help text color
- `--fill-error-color` - Error message color
- `--fill-error-bg` - Error background color

**Buttons:**
- `--fill-button-primary-bg` - Submit button background
- `--fill-button-primary-text` - Submit button text color
- `--fill-button-primary-hover` - Submit button hover state

### 3. Design Tokens

**Spacing scale:**
- `--fill-spacing-xs` - 0.25rem (4px)
- `--fill-spacing-sm` - 0.5rem (8px)
- `--fill-spacing-md` - 1rem (16px)
- `--fill-spacing-lg` - 1.5rem (24px)
- `--fill-spacing-xl` - 2rem (32px)

**Typography scale:**
- `--fill-font-family` - Font family (inherits from parent)
- `--fill-font-size-sm` - 0.875rem (14px)
- `--fill-font-size-base` - 1rem (16px)
- `--fill-font-size-lg` - 1.125rem (18px)
- `--fill-font-size-xl` - 1.25rem (20px)
- `--fill-font-size-2xl` - 1.5rem (24px)
- `--fill-font-size-3xl` - 1.875rem (30px)

**Border radius:**
- `--fill-radius-sm` - 0.25rem (4px)
- `--fill-radius-md` - 0.5rem (8px)
- `--fill-radius-lg` - 0.75rem (12px)

**Shadows:**
- `--fill-shadow-sm` - Subtle shadow
- `--fill-shadow-md` - Medium shadow (used on cards)

## How to Customize the Theme

### Option 1: Modify the Default Theme

Edit `/app/assets/css/themes/variables.css` to change the default theme:

```css
:root {
  /* Change primary color from blue to green */
  --color-primary-600: 22 163 74;  /* green-600 */
  --color-primary-700: 21 128 61;  /* green-700 */

  /* Change card background to light gray */
  --fill-card-bg: 249 250 251;

  /* Increase spacing */
  --fill-spacing-md: 1.25rem;
}
```

### Option 2: Create Theme Variants

You can create different theme files for different use cases:

1. Create a new theme file (e.g., `/app/assets/css/themes/dark.css`):

```css
:root {
  /* Dark theme colors */
  --fill-bg: 17 24 39;  /* dark gray */
  --fill-card-bg: 31 41 55;  /* darker gray */
  --fill-text-primary: 243 244 246;  /* light gray */
  --fill-input-bg: 55 65 81;
  --fill-input-border: 75 85 99;
}
```

2. Import it conditionally in `/app/assets/css/main.css` or load it dynamically based on user preference.

### Option 3: Per-Form Theming (Future Enhancement)

To enable different themes for different forms:

1. Add a `theme` field to the `forms_table` schema
2. Create multiple theme files in `/app/assets/css/themes/`
3. Dynamically load the appropriate theme based on the form's theme setting
4. Apply theme-specific CSS classes or CSS variables to the form container

## Important Notes

### RGB Color Format

All colors use RGB values **without** the `rgb()` wrapper. This allows for alpha transparency:

```css
/* Correct */
--color-primary-600: 37 99 235;

/* Usage with alpha */
background-color: rgb(var(--color-primary-600) / 0.5);
```

### RTL Support

The theme is designed to work with RTL (Right-to-Left) layouts for Hebrew language support. Spacing and layout properties use logical properties where appropriate (e.g., `margin-inline-start` instead of `margin-left`).

### CSS Custom Properties

The theme uses CSS custom properties (CSS variables), which means changes are applied immediately without needing to rebuild the application. This makes it easy to experiment with different color schemes and spacing values during development.

## Example: Creating a Light/Minimal Theme

```css
:root {
  /* Minimal color palette */
  --fill-bg: 255 255 255;
  --fill-card-bg: 255 255 255;
  --fill-text-primary: 0 0 0;
  --fill-text-secondary: 100 100 100;

  /* Subtle inputs */
  --fill-input-bg: 250 250 250;
  --fill-input-border: 230 230 230;
  --fill-input-border-focus: 150 150 150;

  /* Simple button */
  --fill-button-primary-bg: 0 0 0;
  --fill-button-primary-text: 255 255 255;
  --fill-button-primary-hover: 50 50 50;

  /* Minimal spacing */
  --fill-spacing-md: 0.75rem;
  --fill-spacing-lg: 1rem;

  /* Subtle shadows */
  --fill-shadow-md: 0 1px 3px 0 rgb(0 0 0 / 0.05);
}
```

## Troubleshooting

**Theme changes not appearing:**
- Clear your browser cache
- Check that you're editing the correct file (`/app/assets/css/themes/variables.css`)
- Ensure the CSS is being loaded (check browser dev tools)

**Colors look wrong:**
- Verify RGB values are correct (3 numbers separated by spaces, no commas)
- Don't include `rgb()` wrapper in variable definitions
- Check that you're using the correct variable names

**Layout issues:**
- Spacing values should use rem units for consistency
- Test with different content lengths to ensure the layout adapts properly
