# Default Values for All Field Types

## Context

The form builder currently only supports relative date defaults for date/datetime fields. We need to extend default/pre-defined values to all applicable field types. No DB migration needed — `defaultValue` already exists on `BaseElementConfig` and is stored in the JSON `config` column.

Pre-fill data must always override default values. The current pattern (`if (props.modelValue) return` on mount) already handles this since FormFill.vue sets prefill data before child components mount.

---

## Storage Formats

- **Date**: `RelativeDateKey` (e.g. `"today"`) or ISO date string (e.g. `"2026-05-15"`)
- **Time**: `RelativeTimeKey` (e.g. `"1h_ahead"`) or `HH:MM` string (e.g. `"14:30"`)
- **DateTime**: JSON string `{"date":"today","time":"14:30"}` — allows mixing relative/manual for each part. Legacy relative-only keys still supported as fallback.
- **Dropdown/Radio**: option value string
- **Checkboxes**: JSON array string `'["opt1","opt3"]'`
- **Single checkbox**: boolean `true`
- **Text/Email/Number/Textarea**: literal string/number

---

## Steps

### Step 1: Extend `useRelativeDate.ts` with relative time + combined resolver ✅

**File:** `app/composables/useRelativeDate.ts`

- Add `RelativeTimeKey` type: `"now"`, `"30m_ago"`, `"1h_ago"`, `"1_5h_ago"`, `"2h_ago"`, `"30m_ahead"`, `"1h_ahead"`, `"1_5h_ahead"`, `"2h_ahead"`
- Add `relativeTimeLabels` record with Hebrew labels (עכשיו, לפני 30 דקות, לפני שעה, לפני שעה וחצי, לפני שעתיים, עוד 30 דקות, עוד שעה, עוד שעה וחצי, עוד שעתיים)
- Add `resolveRelativeTime(key: string): string | null` — returns `HH:MM` string
- Add `isRelativeDateKey(value: string): boolean`
- Add `isRelativeTimeKey(value: string): boolean`
- Add `resolveDateTimeDefault(defaultValue: string, fieldType: "date" | "datetime" | "time"): string | null` — the main resolver:
  - `date`: resolve relative key or return ISO date as-is
  - `time`: resolve relative time key or return `HH:MM` as-is
  - `datetime`: parse JSON `{date, time}`, resolve each part independently, combine as `YYYY-MM-DDTHH:MM`. Fallback: treat plain string as legacy relative date key with time 00:00

### Step 2: Add default value UI for simple inputs (text, email, number, time, textarea) ✅

**File:** `app/components/form-builder/properties/InputProperties.vue`

- Add default value input for `text`, `email`: `<BaseInput>` with label "ערך ברירת מחדל"
- Add default value input for `number`: `<BaseInput type="number">`
- Add default value input for `time`: `<input type="time">`
- Add default value input for `textarea`: `<BaseInput>` or small textarea
- Place after existing field-specific settings, before the date default section

### Step 3: Enhance date/datetime default UI with manual picker + time combinations ✅

**File:** `app/components/form-builder/properties/InputProperties.vue`

- **Date fields**: replace the current simple dropdown with a mode selector (relative / manual):
  - Relative: existing dropdown of `relativeDateOptions`
  - Manual: `<input type="date">` for specific date
- **DateTime fields**: split into date part + time part:
  - Date part: same relative/manual selector as date
  - Time part: three modes — "ללא" (none/00:00), "שעה יחסית" (relative time dropdown), "שעה ספציפית" (manual `<input type="time">`)
  - Store combined as `JSON.stringify({ date, time })`, parse on load with legacy fallback

### Step 4: Add default value UI for selection fields ✅

**File:** `app/components/form-builder/properties/SelectionProperties.vue`

- **Dropdown/Radio**: add a `<select>` after options editor — "ללא" + all defined options. Stores option value in `defaultValue`
- **Checkboxes**: add checkboxes mirroring defined options, allow multiple selection. Store as JSON array string
- **Single checkbox**: add `<BaseToggle>` labeled "מסומן כברירת מחדל"
- When options are modified/removed, validate `defaultValue` still references valid options — clear if invalid

### Step 5: Apply defaults on mount in FillInput (all input types) ✅

**File:** `app/components/form-fill/elements/FillInput.vue`

Replace the current `onMounted` (lines 28-37) to handle all input types:

- `date/datetime/time`: use `resolveDateTimeDefault()`
- `number`: emit `Number(defaultValue)`
- `text/email`: emit `defaultValue` as-is
- Keep `if (props.modelValue || !config.value.defaultValue) return` guard for pre-fill override

### Step 6: Apply defaults on mount in FillTextarea ✅

**File:** `app/components/form-fill/elements/FillTextarea.vue`

- Add `defaultValue` to config type
- Add `onMounted` with same pattern: check modelValue first, then emit defaultValue

### Step 7: Apply defaults on mount in FillSelection ✅

**File:** `app/components/form-fill/elements/FillSelection.vue`

- Add `defaultValue` to config type
- Add `onMounted`:
  - `checkbox`: emit `true` if `defaultValue === true`
  - `checkboxes`: parse JSON array, emit array of values
  - `dropdown/radio`: emit value string
- Guard: check `modelValue` is not already set (handle boolean/array/string cases)

### Step 8: Show default value hints in builder preview ✅

**Files:**

- `app/components/form-builder/elements/InputElement.vue` — extend existing hint (line 59-61) for all input types: relative date labels, manual dates, time labels, datetime combos, literal text/number values (truncated)
- `app/components/form-builder/elements/SelectionElement.vue` — show default option label(s), visually check default options in preview
- `app/components/form-fill/elements/FillTextarea.vue` (if it has a builder counterpart) — add hint

---

## Verification

1. `pnpm dev` — confirm no build errors
2. In form builder: set default values on each field type (text, email, number, textarea, time, date with manual date, datetime with relative date + manual time, dropdown, radio, checkboxes, single checkbox) — verify hints show in builder preview
3. Fill the form — verify defaults are applied on load
4. Create a submission link with pre-fill data for fields that have defaults — verify pre-fill overrides defaults
5. Test datetime legacy compatibility — forms with existing relative date defaults should still work
