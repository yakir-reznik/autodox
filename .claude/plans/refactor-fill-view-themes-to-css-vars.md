# Form-Fill: Tailwind Classes + Theme CSS Variables

## Context

Form-fill components currently use custom `.form-fill-*` CSS classes defined in `main.css` that reference `--fill-*` variables from theme files. The project already has a shadcn-style Tailwind v4 setup (`tailwind.css`) where CSS variables like `--primary`, `--background`, `--border` map to Tailwind utilities (`bg-primary`, `text-foreground`, `border-input`) via `@theme inline`.

**Goal:** Use Tailwind classes directly in form-fill components, and have theme files override the standard shadcn CSS variables. This eliminates `main.css` almost entirely and makes themes just a set of variable overrides.

## Variable Mapping

Current `--fill-*` → shadcn variable → Tailwind class:
| Current variable | Shadcn variable | Tailwind class |
|---|---|---|
| `--fill-bg` | `--background` | `bg-background` |
| `--fill-card-bg` | `--card` | `bg-card` |
| `--fill-section-bg` | `--accent` | `bg-accent` |
| `--fill-text-primary` | `--foreground` | `text-foreground` |
| `--fill-text-secondary` | `--muted-foreground` | `text-muted-foreground` |
| `--fill-text-muted` | `--muted-foreground` | `text-muted-foreground` |
| `--fill-text-placeholder` | (Tailwind built-in) | `placeholder:text-muted-foreground` |
| `--fill-label-color` | `--foreground` | `text-foreground` |
| `--fill-input-bg` | `--card` | `bg-card` |
| `--fill-input-border` | `--input` | `border-input` |
| `--fill-input-border-focus` | `--ring` | `focus:ring-ring` |
| `--fill-input-text` | `--foreground` | `text-foreground` |
| `--fill-required-color` | `--destructive` | `text-destructive` |
| `--fill-error-color` | `--destructive` | `text-destructive` |
| `--fill-error-bg` | (alpha) | `bg-destructive/10` |
| `--fill-button-primary-bg` | `--primary` | `bg-primary` |
| `--fill-button-primary-text` | `--primary-foreground` | `text-primary-foreground` |
| `--fill-button-primary-hover` | (alpha) | `hover:bg-primary/90` |
| `--fill-spacing-*` | Tailwind spacing | `p-4`, `gap-6`, etc. |
| `--fill-font-family` | `--font-sans` | `font-sans` |
| `--fill-font-size-*` | Tailwind text size | `text-sm`, `text-base`, `text-lg` |
| `--fill-radius-*` | `--radius` | `rounded-md`, `rounded-lg` |
| `--fill-shadow-*` | `--shadow-*` | `shadow-md`, `shadow-lg` |

## Steps

### Step 1: Convert ocean theme to use shadcn variable names

Update only `ocean.css` for now. Other themes will be converted later if this works well.

**File:** `public/assets/css/themes/ocean.css`

Override `:root` with:

```css
:root {
  --background: oklch(...); /* page bg */
  --foreground: oklch(...); /* primary text */
  --card: oklch(...); /* card/input bg */
  --card-foreground: oklch(...);
  --primary: oklch(...); /* buttons, links, focus */
  --primary-foreground: oklch(...);
  --secondary: oklch(...);
  --muted: oklch(...);
  --muted-foreground: oklch(...); /* secondary text, help text, placeholders */
  --accent: oklch(...); /* section bg, hover bg */
  --accent-foreground: oklch(...);
  --destructive: oklch(...); /* errors, required */
  --destructive-foreground: oklch(...);
  --border: oklch(...);
  --input: oklch(...); /* input borders */
  --ring: oklch(...); /* focus ring */
  --radius: 0.5rem;
  --font-sans: "Rubik", sans-serif;
  --shadow-md: ...;
}
```

Convert current RGB values to oklch format to match the existing Tailwind setup. Other theme files (`dark.css`, `forest.css`, `unicorn.css`, `variables.css`) will be converted in a follow-up after validating the ocean theme.

### Step 2: Refactor `main.css` — strip styling from `.form-fill-*` classes, keep only browser overrides

Remove the styling rules from `.form-fill-*` classes (make them empty or remove their property declarations) but **keep the class names defined** so they remain as hooks. Keep only:

- Custom checkbox/radio appearance override (checkmark SVG, radio dot SVG) — these need `appearance: none` and custom background-image
- Select dropdown arrow SVG
- Number input spinner hiding (`::-webkit-*`)
- Date/time picker indicator styling
- `@media (prefers-reduced-motion)` rule
- Font smoothing on container
- Font inheritance on inputs

These are browser-level overrides that Tailwind can't handle. Update their variable references from `--fill-*` to shadcn names.

### Step 3: Refactor `FormFill.vue` — add Tailwind classes alongside existing ones

Add Tailwind utility classes to components. **Keep the `.form-fill-*` class names** — we may need them later. The Tailwind classes provide the styling, the `.form-fill-*` classes stay as hooks:

- `.form-fill-container` → `min-h-screen bg-background font-sans p-6`
- `.form-fill-card` → `max-w-[640px] mx-auto bg-card rounded-lg shadow-md p-8`
- `.form-fill-header` → `mb-8 text-center`
- `.form-fill-title` → `text-2xl font-semibold text-foreground mb-2`
- `.form-fill-description` → `text-base text-muted-foreground`
- `.form-fill-elements` → `flex flex-col gap-6`
- `.form-fill-submit` → `w-full bg-primary text-primary-foreground text-base font-medium py-2 px-6 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`
- `.form-fill-footer` → `mt-8`
- Success/error/loading states — same pattern with Tailwind classes
- Error summary — `bg-destructive/10 border border-destructive/30 rounded-md p-4`

### Step 4: Refactor `FormField.vue` — Tailwind wrapper

Add Tailwind classes alongside existing `.form-fill-field`: `flex flex-col` + keep `.form-fill-field` and `.has-error` class names as hooks

### Step 5: Refactor key element components (pilot)

Add Tailwind utility classes **alongside** existing `.form-fill-*` class names (keep them as hooks). Only do these 3 to validate the approach:

**`FillInput.vue`:** (most common element — good baseline)

- `.form-fill-label` + `block text-sm font-medium text-foreground mb-1`
- `.form-fill-required` + `text-destructive ms-0.5`
- `.form-fill-input` + `w-full bg-card border border-input rounded-md py-2 px-4 text-base text-foreground transition-colors focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/10 placeholder:text-muted-foreground`
- Error state: conditional `border-destructive` class
- `.form-fill-error` + `text-sm text-destructive mt-1`
- `.form-fill-help` + `text-sm text-muted-foreground mt-1`

**`FillSelection.vue`:** (tests radio/checkbox/dropdown rendering)

- `.form-fill-select` + Tailwind input classes + `cursor-pointer`
- `.form-fill-radio-group`/`.form-fill-checkbox-group` + `flex flex-col gap-2`
- `.form-fill-radio-option`/`.form-fill-checkbox-option` + `flex items-center gap-2 cursor-pointer`
- Option text spans + `text-base text-foreground`
- Keep scoped grid styles for responsive columns

**`FillRepeater.vue`:** (tests hardcoded Tailwind replacement)

- Item container: `.form-fill-repeater-item` + `relative rounded-md border border-input p-4 bg-accent`
- Item header: `.form-fill-repeater-header` + `flex items-center justify-between mb-3`
- Index label: `.form-fill-repeater-index` + `text-sm font-medium text-muted-foreground`
- Remove button: `.form-fill-repeater-remove` + `rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive`
- Add button: `.form-fill-repeater-add` + `mt-4 flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-input py-3 px-4 text-sm text-muted-foreground transition-colors hover:border-ring hover:bg-ring/5 hover:text-ring`
- Remove `itemStyle` computed (hardcoded `#f9fafb`)

### Step 6: Refactor `PasswordGate.vue` and `TokenGate.vue`

Add Tailwind utility classes **alongside** existing `.form-fill-*` class names (keep them as hooks).

### Step 7: Verify print view compatibility

Check `app/components/form-print/` — if it uses `.form-fill-*` classes, add Tailwind classes alongside them (keep `.form-fill-*` as hooks).

### Step 8: Operator verification

Run `pnpm dev` and verify the ocean theme renders correctly:

1. Open a form that uses the **ocean** theme at `/fill/{form_id}`
2. Check that text inputs, dropdowns, radio/checkbox groups, and repeaters display correctly
3. Submit the form with empty required fields — verify error states (red borders, error messages)
4. Test repeater add/remove buttons
5. Check the print view still works

### Step 9: Remaining work (after verification)

Once the ocean theme is verified, complete the refactor:

- **Remaining element components:** `FillTextarea.vue`, `FillSignature.vue`, `FillSection.vue`, `FillHeading.vue`, `FillParagraph.vue`, `FillDivider.vue`, `FillMedia.vue`, `FillSpacer.vue`
- **Remaining theme files:** Convert `dark.css`, `forest.css`, `unicorn.css`, `variables.css` to shadcn variable names (use ocean.css as reference)

## Critical Files

- `public/assets/css/themes/ocean.css` — convert to shadcn variables
- `app/assets/css/main.css` — strip styling, keep class names + browser overrides
- `app/components/form-fill/FormFill.vue` — add Tailwind classes
- `app/components/form-fill/FormField.vue` — add Tailwind classes
- `app/components/form-fill/elements/FillInput.vue` — pilot input component
- `app/components/form-fill/elements/FillSelection.vue` — pilot selection component
- `app/components/form-fill/elements/FillRepeater.vue` — pilot repeater component
- `app/assets/css/tailwind.css` — may need minor additions to `@theme inline` if any new semantic tokens are needed
