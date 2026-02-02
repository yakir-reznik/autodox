# This is not done - force yakir to review this before implementing!!!

# Field Conditional Logic

Show/hide fields or sections based on previous answers. Also supports dynamically requiring fields.

## Requirements

- **Actions**: Show/Hide + toggle Required based on conditions
- **Logic**: AND / OR toggle when multiple conditions on one element
- **Scope**: Fields AND sections (hiding a section hides all children)
- **Operators**: equals, not_equals, is_empty, is_not_empty, contains, greater_than, less_than
- **Evaluation**: Fill side only. Builder always shows all elements with a visual indicator.
- **Editor**: Section in existing PropertyPanel sidebar

## Type Definitions

```typescript
type ConditionOperator =
  | "equals"
  | "not_equals"
  | "is_empty"
  | "is_not_empty"
  | "contains"
  | "greater_than"
  | "less_than";

type ConditionAction = "show" | "hide" | "require";

type ConditionRule = {
  sourceFieldId: string; // clientId of source field (converted to serverId on save)
  operator: ConditionOperator;
  value?: string | number | boolean; // not needed for is_empty/is_not_empty
};

type ConditionGroup = {
  enabled: boolean;
  action: ConditionAction;
  logic: "and" | "or";
  rules: ConditionRule[];
};
```

`BuilderElement` gets: `conditions?: ConditionGroup | null`

## Storage Strategy

Conditions are stored inside the existing `config` JSON column under a `_conditions` key. This requires **zero DB migrations** and **zero server changes**. On load, `_conditions` is extracted from config and placed on `BuilderElement.conditions`. On save, it's folded back into config.

## Implementation Steps

### Step 1: Add type definitions ✅

**Files:**

- `server/db/schema.ts` — Add `ConditionOperator`, `ConditionRule`, `ConditionAction`, `ConditionGroup` type exports (after `ValidationRules`)
- `app/types/form-builder.ts` — Import/re-export `ConditionGroup`. Add `conditions?: ConditionGroup | null` to `BuilderElement`

### Step 2: Add `isConditionSource` helper ✅

**File:** `app/composables/useElementDefaults.ts`

- Add `isConditionSource(type: ElementType): boolean` — returns true for: text, email, number, textarea, date, time, datetime, dropdown, radio, checkbox, checkboxes

### Step 3: Condition serialization in save/load ✅

**File:** `app/composables/useFormBuilder.ts`

**In `save()`:** When building `elementsPayload`, embed `el.conditions` into config as `_conditions` with sourceFieldIds mapped from clientId to serverId (using existing `clientIdToServerId` map).

**In `loadForm()`:** When creating BuilderElements, extract `_conditions` from config, map sourceFieldIds from serverId to clientId (using existing `serverIdToClientId` map), place on `conditions` field.

**In `duplicateElement()`:** Include conditions in deep clone:

```typescript
conditions: element.conditions ? JSON.parse(JSON.stringify(element.conditions)) : null,
```

**In `removeElement()`:** After removing, scan all remaining elements and remove condition rules that reference the deleted element's clientId. If rules array becomes empty, set `conditions.enabled = false`.

### Step 4: Create condition evaluator composable ✅

**New file:** `app/composables/useConditionEvaluator.ts`

```typescript
export function useConditionEvaluator(
  elements: Ref<BuilderElement[]> | ComputedRef<BuilderElement[]>,
  formData: Record<string, any>,
): { isVisible; isRequiredByCondition };
```

- Evaluates all 7 operators
- Handles AND/OR logic per element
- show/hide/require actions
- If source field is hidden, treat its value as empty
- Section hiding cascades to children
- Returns reactive `isVisible(clientId)` and `isRequiredByCondition(clientId)` functions

### Step 5: Create ConditionEditor UI component ✅

**New file:** `app/components/form-builder/properties/ConditionEditor.vue`

Props: `element: BuilderElement`, `allElements: BuilderElement[]`
Emits: `update:conditions`

UI structure (Hebrew):

1. Header: "לוגיקה מותנית" with enable/disable toggle
2. Action selector: "הצג כאשר..." / "הסתר כאשר..." / "חובה כאשר..."
3. Logic toggle (when 2+ rules): "כל התנאים" (AND) / "אחד מהתנאים" (OR)
4. Rules list: source field dropdown + operator dropdown + value input + remove button
5. "הוסף תנאי +" button

Source field dropdown filtering:

- Only `isConditionSource` elements
- Exclude the target element itself
- Exclude children of the target (if section/repeater)
- Exclude repeater children (elements inside a repeater parent)
- Exclude elements that would create circular dependencies

Value input adapts to source field type:

- Selection fields → dropdown of source's options
- checkbox → true/false dropdown
- number → number input
- is_empty/is_not_empty → hide value input

Operator labels (Hebrew): שווה ל, שונה מ, ריק, לא ריק, מכיל, גדול מ, קטן מ

### Step 6: Integrate ConditionEditor into PropertyPanel ✅

**Files:**

- `app/components/form-builder/PropertyPanel.vue` — Add `allElements` prop, render `ConditionEditor` after ValidationEditor (available for ALL element types), add `updateConditions` handler
- `app/components/form-builder/FormBuilder.vue` — Pass `state.elements` as `allElements` prop to PropertyPanel

### Step 7: Visual indicator in builder

**File:** `app/components/form-builder/elements/ElementWrapper.vue`

When `element.conditions?.enabled && element.conditions.rules.length > 0`, show a small amber bolt icon badge near the action buttons:

```html
<Icon name="heroicons:bolt" class="h-3.5 w-3.5" />
```

### Step 8: Form fill integration ✅

**File:** `app/components/form-fill/FormFill.vue`

1. Extract `_conditions` from config in `allElements` computed, map sourceFieldIds to fill-side clientIds (`el_${serverId}`)
2. Initialize `useConditionEvaluator(allElements, formData)`
3. Create `visibleRootElements` computed filtering by `isVisible`
4. Create `getVisibleChildElements(parentClientId)` filtering children by `isVisible`
5. Update `validateAll()` to skip hidden elements and handle `require` conditions
6. Update submit handler to exclude hidden elements from submission data
7. Update template to use filtered element lists

#### Implementation Notes (context for standalone agent)

**useConditionEvaluator API** (file: `app/composables/useConditionEvaluator.ts`):

```typescript
const { isVisible, isRequiredByCondition } = useConditionEvaluator(elements, formData);
// isVisible(clientId: string): boolean — checks show/hide conditions + parent cascade
// isRequiredByCondition(clientId: string): boolean — checks "require" action conditions
```

Both functions are reactive — they access `formData` (reactive object) and `elements` (Ref/ComputedRef), so they auto-track when used inside computed/templates.

**Key details about FormFill.vue** (590 lines total):

- `allElements` computed (line ~148): Converts server elements to `BuilderElement[]`. Currently does NOT extract `_conditions` from config. ClientIds follow pattern `el_${serverId}` (e.g., `el_5`). Must add: destructure `_conditions` from `el.config`, map each rule's `sourceFieldId` from serverId string to fill-side clientId (`el_${sourceServerId}`), and set `conditions` field on the BuilderElement.

- `rootElements` computed (line ~168): Filters `allElements` by `!el.parentId`. Replace usage in template with `visibleRootElements` that also filters by `isVisible`.

- `getChildElements` function (line ~177): Returns children of a parent. Add a `getVisibleChildElements` variant that filters by `isVisible`. Pass this to `FormField` components so sections/repeaters only see visible children.

- `validateAll()` function (line ~313): Loops over `allElements`. Must skip hidden elements (`!isVisible(element.clientId)`). Must also treat `isRequiredByCondition(clientId)` as making a field required (same as `element.isRequired`).

- `validateFieldValue()` function (line ~193): Called by `validateField` and `validateRepeater`. The required check at line ~210 currently checks `element.isRequired || config.validation?.required`. For condition-based require, the caller should pass an additional flag or check `isRequiredByCondition` before calling.

- `handleSubmit()` function (line ~399): Builds `submissionData` from `formData`. Must skip hidden elements — add `isVisible(clientId)` check before including in submission data.

- Template `rootElements` usage (line ~544): `<FormField v-for="element in rootElements" ...>`. Change to `visibleRootElements`.

- Template `getChildElements` prop (line ~548): `:get-children="getChildElements"`. Change to `getVisibleChildElements`.

- `formData` is `reactive<Record<string, any>>({})` keyed by clientId.

- `errors` is `reactive<Record<string, string>>({})` keyed by clientId.

**\_conditions storage**: Conditions are stored inside the element's `config` JSON column under a `_conditions` key by the builder's save function. The `_conditions` object shape is `ConditionGroup`:

```typescript
{ enabled: boolean, action: "show"|"hide"|"require", logic: "and"|"or", rules: ConditionRule[] }
// ConditionRule: { sourceFieldId: string, operator: ConditionOperator, value?: string|number|boolean }
```

In the DB, `sourceFieldId` values are server element IDs (as strings). On the fill side, they must be mapped to fill-side clientIds: `el_${sourceFieldId}`.

**Imports needed**: `ConditionGroup` from `~/types/form-builder`, `useConditionEvaluator` is auto-imported by Nuxt (it's in `app/composables/`).

### Step 9: Section and repeater fill-side visibility ✅

**Files:**

- `app/components/form-fill/elements/FillSection.vue` — Use filtered `getChildren` prop
- `app/components/form-fill/elements/FillRepeater.vue` — Same pattern

## Edge Cases Handled

- **Deleted source fields**: `removeElement()` cleans up orphaned condition rules
- **Duplicated elements**: Conditions are deep-cloned, references remain valid
- **Moved elements**: clientId doesn't change, conditions stay valid
- **Hidden source fields**: Treated as empty during evaluation
- **Circular deps**: Prevented in ConditionEditor UI by filtering source field list
- **Repeater children as sources**: Excluded from source list (ambiguous cross-row logic)
- **Undo/redo**: Works automatically since conditions are on `BuilderElement`, included in history snapshots

## Verification

1. **Builder side**: Add conditions to a text field (e.g., "show when dropdown equals X"). Verify amber badge appears. Save form, reload — conditions should persist.
2. **Fill side**: Open the form fill page. Verify the conditioned field is hidden/shown based on the source field's value. Change the source value — target should reactively show/hide.
3. **Validation**: Submit with a hidden required field — should pass (hidden fields excluded). Show the field via condition — should now validate as required.
4. **Sections**: Add condition to a section. Verify all children hide/show together.
5. **Delete source**: Delete a field referenced by a condition. Verify the orphaned rule is cleaned up.
6. **Require action**: Set a condition with "require" action. Verify the field becomes required only when the condition is met.

## Todo's and bugs

- [ ] in form 3 email field has a conditional rule to show when firstName="אימייל". if i paste "אימייל" in firstName field - the email field is shown. But if i type it in letter by letter it doesnt show the email field... now im not sure it works when pasting...
- [ ] When a field becomes mandatory because of a conditional rule - we need to display a red asterisk next to it. if it stops being a required field - don't show the asterisk
- [ ] In the FormBuilder - change the conditional logic rules to be viewed and managed in a modal, It clunky in the field properties sidebar.
