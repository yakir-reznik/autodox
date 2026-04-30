# Block duplicate field names at the same submission scope

## Context

In the form builder, a user can give two fields at the same level the same `name` (e.g. two top-level fields both named `phoneNumber`, or two siblings inside the same repeater both named `aaa`). Today nothing prevents this.

This is real data corruption, not just cosmetic. In `app/components/form-fill/FormFill.vue` (`handleSubmit`, ~lines 568–627), submission data is built keyed by `element.name`:

```ts
submissionData[key] = value; // key = element.name || clientId
```

When two siblings share a name, the second one silently overwrites the first — the user fills both fields, only one value reaches the server. The same applies inside repeaters, where each item is also keyed by child field name.

Auto-naming via `generateUniqueName()` in `useFormBuilder.ts` already produces unique defaults (`text1`, `text2`...). Collisions only occur when the user manually edits the name input in `BaseProperties.vue`. There is currently no validation, no UI signal, and no server-side guard.

## Goal

Detect duplicate field names within the same submission scope, block save until resolved, and clearly point the user at every offending field.

User-confirmed UX decisions:
- **Enforcement**: block save entirely (auto-save + manual). Drafts may be in-progress, but data corruption risk is too high to allow.
- **Error surfacing**: inline error in PropertyPanel name input + visual badge on the canvas + toast on save attempt.

## Scope definition

A "submission scope" is the keyspace produced by `handleSubmit`. From the code:

- Layout elements (`section`, `grid`) are **not** scope boundaries — fields under them flatten into their nearest non-layout ancestor.
- `repeater` **is** a scope boundary — its direct field descendants form a per-item object.
- Root scope = everything not inside a repeater.

Implementation: walk `parentId` upward; the scope key is the `clientId` of the nearest `repeater` ancestor, or `null` for root. Two fields conflict iff they have the same scope key and the same non-empty `name`.

Only field elements (`isFieldElement(type)`, includes `repeater`) participate. Layout elements have `name === null` and are skipped.

Note: a repeater itself has a `name` and lives in the *parent's* scope, so a top-level repeater named `phone` collides with a top-level text field named `phone`. This is correct — that's exactly how the submission key would collide.

## Approach

### 1. New composable: `app/composables/useFieldNameValidation.ts`

Exports a function taking a reactive `elements` array and returning:

```ts
{
	duplicateClientIds: ComputedRef<Set<string>>;        // every clientId in any conflicting group
	duplicateGroups: ComputedRef<DuplicateGroup[]>;       // [{ scopeKey, name, clientIds: string[] }]
	conflictsFor: (clientId: string) => BuilderElement[]; // siblings sharing this element's name
	hasDuplicates: ComputedRef<boolean>;
}
```

Internally it builds a `Map<scopeKey, Map<name, clientId[]>>` from `elements`, where `scopeKey` is computed by walking `parentId` to the nearest repeater. Any inner array with `length > 1` is a duplicate group. Pure derived state, recomputes whenever `state.elements` mutates.

Reuses `isFieldElement` from `useElementDefaults.ts`.

### 2. Wire validation into the builder state

`app/composables/useFormBuilder.ts`:

- Instantiate `useFieldNameValidation(state.elements)` inside `useFormBuilder`.
- Expose `hasDuplicates`, `duplicateClientIds`, `duplicateGroups`, `conflictsFor` from the return object.
- In `save()` (line 369), before any network call, check `hasDuplicates.value`. If true:
  - Set `state.saveError = "Duplicate field names"` (or a dedicated error code).
  - `throw new DuplicateFieldNamesError(duplicateGroups.value)` — a small custom error class so callers can distinguish.
  - Do not flip `isSaving`/network state — same `try/finally` shape as today.

This means `useAutoSave` will see the rejection too. Its current `onError` just `console.error`s; we'll upgrade it (next step).

### 3. Toast on save attempt

`app/components/form-builder/FormBuilder.vue`:

- In the `useAutoSave({ onError })` callback, detect `DuplicateFieldNamesError` and push an error toast via `useToasts()` with a Hebrew message like "לא ניתן לשמור: ישנם שדות עם שמות כפולים" + a count. Skip the toast for non-duplicate errors (keep current console.error behavior).
- For manual save (`forceSave` triggered from `FormHeader.vue`'s save button), the same code path applies — `onError` will fire there too.
- Avoid spamming: throttle so we don't show the same toast for every keystroke that triggers auto-save. Simplest approach — only toast on `forceSave` (manual save) attempts, since auto-save while editing would be noisy. Auto-save will silently no-op on duplicates; the inline error + canvas badge already tell the user. That keeps toasts as a "you tried to save and it didn't work" signal.

Concretely: change `useAutoSave` to accept an `isBlocked` predicate or, simpler, gate `triggerSave()` in FormBuilder behind `!hasDuplicates.value` and let `forceSave()` still call through and surface the toast on rejection.

### 4. Inline error in PropertyPanel

`app/components/form-builder/properties/BaseProperties.vue`:

- Accept new prop `conflicts: BuilderElement[]` (the siblings sharing this name; empty array means no conflict).
- When non-empty, render a red error message under the Field Name input listing the conflicting field labels (or names) as click-to-jump links. Clicking emits a new event `select-field: clientId` that bubbles up.
- Use existing Tailwind error styling already used in `FormFill.vue` for visual consistency.

`app/components/form-builder/PropertyPanel.vue`:

- Compute `conflicts` from `props.allElements` (already available, see FormBuilder.vue:46) and the current element using `useFieldNameValidation`'s `conflictsFor`. Pass into BaseProperties.
- Forward the `select-field` event up to FormBuilder, which calls `selectElement(clientId)`.

### 5. Visual badge on canvas

`app/components/form-builder/FormCanvas.vue` and the per-element field components in `app/components/form-builder/elements/`:

- Pass `duplicateClientIds: Set<string>` from FormBuilder down into FormCanvas (new prop), and from FormCanvas into each rendered element card.
- On any field card whose `clientId` is in the set, render a small red badge (e.g. `heroicons:exclamation-circle` icon with a tooltip "שם שדה כפול") in the card's corner. Reuse existing card chrome — no new wrapper component needed.
- Keep the badge non-interactive — clicking the field still selects it as today; the inline error in PropertyPanel is where the user resolves it.

### 6. Server-side defense-in-depth

`server/api/forms/[id]/elements.put.ts`:

- Before insert/update, run the same scope-grouping logic on the incoming `elements` payload (the server uses `tempId`/`id` instead of `clientId`, but the grouping logic is identical: walk parent chain, group by scope + name).
- If duplicates exist, respond `400` with a body like `{ error: "duplicate_field_names", duplicates: [{ scopeId, name, ids }] }`.
- This guards against API misuse; the client should never hit it under normal flow because step 2 blocks before sending.

To avoid duplicating the scope-grouping logic, extract a shared helper. Since client and server can't share runtime composables, place a pure function in `app/types/form-builder.ts` (or a sibling `app/utils/fieldNameValidation.ts` that's importable from both contexts in Nuxt 4 — verify this at implementation time). The helper takes a generic `{ id, name, parentId, type }[]` and returns duplicate groups. The composable wraps it for reactivity; the server endpoint calls it directly.

## Critical files

- `app/composables/useFieldNameValidation.ts` *(new)*
- `app/utils/fieldNameValidation.ts` *(new — pure scope-grouping helper, shared with server)*
- `app/composables/useFormBuilder.ts` — gate `save()`, expose validation state
- `app/components/form-builder/FormBuilder.vue` — wire toast on save error, gate auto-save trigger
- `app/components/form-builder/PropertyPanel.vue` — pass conflicts through, forward `select-field`
- `app/components/form-builder/properties/BaseProperties.vue` — inline error UI under name input
- `app/components/form-builder/FormCanvas.vue` and elements under `app/components/form-builder/elements/` — duplicate badge
- `server/api/forms/[id]/elements.put.ts` — server-side rejection

## Reused existing utilities

- `isFieldElement` from `app/composables/useElementDefaults.ts` — identifies which elements participate.
- `useToasts` store at `app/stores/toasts.ts` (`error` theme) — for the save-blocked toast.
- Existing error styling patterns in `app/components/form-fill/FormFill.vue`.

## Verification

1. **Manual UI flow**:
   - Open an existing form. Add two top-level text fields. Rename the second one's `name` to match the first.
   - Confirm: red badge appears on both cards in the canvas; selecting either shows an inline error in the property panel listing the other field as a clickable link; clicking the link selects the other field.
   - Click the manual Save button in the header — confirm an error toast appears in Hebrew and no network request goes out (check devtools).
   - Wait past the 10s auto-save debounce — confirm no network request goes out and `state.isDirty` stays true.
   - Fix one of the names — badges, inline error, and save block all clear; next auto-save fires and succeeds.
2. **Repeater scope**:
   - Add a repeater with two children, both named `aaa`. Confirm conflict detected inside the repeater scope.
   - Add a top-level field also named `aaa`. Confirm it does **not** conflict with the repeater's children (different scope), but it *would* conflict with another top-level field of the same name.
3. **Section/grid pass-through**:
   - Put a field named `x` directly at root, and another field named `x` inside a section at root. Confirm they conflict (sections are not scope boundaries).
4. **Server defense**: with devtools, manually `PUT /api/forms/{id}/elements` with a payload containing a duplicate. Confirm `400` with the expected error shape.
5. **Type check**: `pnpm run typecheck`.
