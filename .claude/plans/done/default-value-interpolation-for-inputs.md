# Plan: Live interpolation for field `defaultValue`

## Context

Today, `{{fieldName}}` interpolation works only in read-only elements (`FillParagraph.vue`, `FillHeading.vue`) via `interpolateFieldValues()` from `app/utils/interpolate.ts`. Form authors want the same power in **editable** fields — specifically, the `defaultValue` of text-like inputs should be able to reference other fields (e.g. a textarea whose defaultValue is `"Hello {{firstName}}"` that auto-updates as `firstName` is typed).

Current behavior: `FormFill.vue:213-236` (`applyDefaults`) copies `defaultValue` into `formData` once, verbatim. No token handling.

Goal: when a string-field's `defaultValue` contains `{{...}}` tokens, the field's value should be **always live** — continuously re-interpolated from the current form state, even overwriting prior user edits (per user's explicit choice). Fields without tokens keep today's one-time default behavior.

Scope: text, email, phone, textarea only (the string-valued input types). Other config keys (label, placeholder, helpText, option labels) are **not** in scope.

## Approach

Handle interpolation centrally in `FormFill.vue`. No new composable — any new shared helpers go into `app/utils/interpolate.ts`. No changes to individual `Fill*` input components: they already render `modelValue` from `formData`, so rewriting `formData[clientId]` reactively is enough.

### Files to change

1. **`app/utils/interpolate.ts`**
   - Add and export `hasInterpolationTokens(text: string): boolean` — returns `/\{\{\w+\}\}/.test(text)`. Used to cheaply detect whether a `defaultValue` is a template.
   - Add and export `getReferencedTokens(text: string): string[]` — returns the list of field names referenced inside `{{...}}` (deduped). Used for self-reference detection.
   - `interpolateRawValues` (line 101) is already the right primitive for input values (raw, not HTML-escaped) — reuse it as-is.

2. **`app/components/form-fill/FormFill.vue`**
   - Add a `watchEffect` (placed after `applyDefaults`/`watch` at line 244) that iterates `allElements.value` and, for each element where:
     - `element.type` is one of `text`, `email`, `phone`, `textarea`,
     - `element.config.defaultValue` is a string with `hasInterpolationTokens(...) === true`,
     - the template does not self-reference (skip if `getReferencedTokens(defaultValue)` includes `element.name`) — guards against infinite update loops,

     writes `interpolateRawValues(defaultValue, allElements.value, formData, prefillData.value)` into `formData[element.clientId]`. Because `watchEffect` tracks all reactive reads (elements list, every `formData[clientId]` read inside `resolveToken`, prefillData), it re-runs whenever any referenced value changes — delivering "always live" behavior.

   - In `applyDefaults` (lines 213-236), skip string-field elements whose `defaultValue` contains tokens — they are owned by the `watchEffect`. Non-templated defaults keep today's one-time apply.

### Reused utilities

- `interpolateRawValues` — `app/utils/interpolate.ts:101`.
- Injection keys already provided in `FormFill.vue:203-210` (consumed here directly, since FormFill is also where they are created).

### Out of scope (explicitly)

- Label / placeholder / helpText / option-label interpolation.
- Non-string field types (number, date, dropdown, radio, checkbox, checkboxes). Their `defaultValue` is structured/typed and a token template doesn't fit cleanly — can be added later if needed.
- No changes to `FillParagraph.vue` / `FillHeading.vue`.

## Verification

1. `pnpm dev`, open a form in the builder.
2. Build a form with:
   - A text field named `firstName`.
   - A textarea whose `defaultValue` is `Hello {{firstName}}!`.
3. Fill the form. As `firstName` is typed, the textarea's value should update live. Typing into the textarea should be overwritten on the next `firstName` keystroke (confirms "always live").
4. A non-templated `defaultValue` (e.g. plain `"hi"`) should still apply once and remain user-editable.
5. A self-referencing template (e.g. a field named `x` with defaultValue `{{x}}`) should **not** crash or infinite-loop — the guard skips it, leaving the raw template as-is.
6. Confirm a paragraph elsewhere still interpolates `{{firstName}}` as before (no regression in read-only flow).
