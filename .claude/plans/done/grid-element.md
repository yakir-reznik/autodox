# Add Grid Element to Form Builder

## Context

The form builder currently has two container ("parent") elements — **section** and **repeater** — plus many leaf elements. The user wants a new **grid** container that arranges its children in a responsive column layout. Unlike section/repeater, the grid cannot contain other container elements (only leaves), and it cannot be nested inside section/repeater: **grid is a top-level-only container**. This fills a real layout gap: today, placing two fields side-by-side on desktop requires hand-rolled workarounds, and there's no way to express different layouts for desktop vs. mobile.

## Decisions (from clarification)

- **Placement**: grid can only live at the root of the form (not inside section/repeater/grid).
- **Children**: only leaf elements — no sections, repeaters, or nested grids.
- **Layout props** (each has a desktop + mobile value):
  - `columns` (number, 1–12)
  - `gap` (spacing value)
  - `justify` (horizontal: start / center / end / stretch)
  - `align` (vertical: start / center / end / stretch)
- **No per-child column span** for v1 — every child takes one cell.
- **No viewport toggle** in the builder. Builder canvas always renders the desktop layout; mobile values only take effect in the live/fill form via Tailwind responsive classes.

## Files to Modify / Create

### Schema & types

- `server/db/schema.ts`
  - Add `"grid"` to `elementTypeEnum` (in the layout-elements section, ~line 47).
  - Add `GridConfig` type with desktop/mobile variants for `columns`, `gap`, `justify`, `align`. Example shape:
    ```ts
    type GridAxis = "start" | "center" | "end" | "stretch";
    type GridConfig = {
      columns: { desktop: number; mobile: number };
      gap: { desktop: string; mobile: string };
      justify: { desktop: GridAxis; mobile: GridAxis };
      align: { desktop: GridAxis; mobile: GridAxis };
    };
    ```
  - Add `GridConfig` to the `ElementConfig` union (~line 212).

### Element defaults & registry

- `app/composables/useElementDefaults.ts`
  - `getDefaultConfig()` (~line 160): add `grid` case with defaults `{ columns: { desktop: 2, mobile: 1 }, gap: { desktop: "1rem", mobile: "0.5rem" }, justify: { desktop: "stretch", mobile: "stretch" }, align: { desktop: "start", mobile: "start" } }`.
  - `usePaletteElements()` (~line 184): add grid entry in the layout category with Hebrew label (e.g. `"רשת"`) and an icon (e.g. `heroicons:squares-2x2`).
  - `getElementComponent()` (~line 347): map `grid → "GridElement"`.

### Builder (edit mode)

- `app/components/form-builder/elements/GridElement.vue` — **new**. Model after `SectionElement.vue`. Renders a container with a `<draggable>` child slot. Applies CSS grid using **desktop values only** (builder shows desktop layout). Compute classes from the config:
  - `display: grid`
  - `grid-template-columns: repeat({columns.desktop}, minmax(0, 1fr))`
  - `gap: {gap.desktop}`
  - `justify-items: {justify.desktop}`
  - `align-items: {align.desktop}`
- `app/components/form-builder/elements/ElementWrapper.vue` (~line 46)
  - Extend `isContainer` to include `"grid"` so nested draggable is enabled.
  - **Containment rules**: in the drag/drop handler (`handleNestedChange`, ~line 68), reject drops where a `section`, `repeater`, or `grid` is being dropped **into a grid**. Also, at the top-level drop handler that places a grid, reject placing a grid inside a section or repeater. Reuse a small helper like `canAccept(parentType, childType)` so the rule is declared in one place.

### Builder (properties panel)

- `app/components/form-builder/PropertyPanel.vue` (~line 108): add `<FormBuilderPropertiesGridProperties v-if="element.type === 'grid'" ... />`.
- `app/components/form-builder/properties/GridProperties.vue` — **new**. Pattern after `RepeaterProperties.vue`. Render two groups: **Desktop** and **Mobile**, each with number input for columns, text/select for gap, and select for justify/align.

### Fill mode

- `app/components/form-fill/elements/FillGrid.vue` — **new**. Pattern after `FillSection.vue`. Fetch children via `getChildren(element.clientId)`. Apply layout using **Tailwind responsive utilities** so mobile values apply by default and desktop values override at `md:` and above:
  - Container: `grid` + `grid-cols-{mobile.columns}` + `md:grid-cols-{desktop.columns}` + gap/justify/align equivalents. Because Tailwind can't generate arbitrary values from runtime, use **inline CSS variables** + a small style binding (mirroring how `backgroundColor` is already bound inline in `SectionElement.vue`), e.g.:
    ```html
    <div
      class="grid"
      :style="{
    		'--cols-m': config.columns.mobile,
    		'--cols-d': config.columns.desktop,
    		'--gap-m': config.gap.mobile,
    		'--gap-d': config.gap.desktop,
    		gridTemplateColumns: `repeat(var(--cols-m), minmax(0, 1fr))`,
    		gap: 'var(--gap-m)',
    		justifyItems: config.justify.mobile,
    		alignItems: config.align.mobile,
    	}"
    ></div>
    ```
    and use a small `@media (min-width: 768px)` block (scoped `<style>`) that swaps to the desktop CSS vars. Matches the app's existing pattern of inline styles for element-level styling.

### Cascade delete & clone

- `app/composables/useFormBuilder.ts`
  - `removeElement()` (~line 153): add `"grid"` to the cascade-delete condition alongside section/repeater so grid's children are removed with it.
  - `cloneElementTree()` (~line 262): add `"grid"` so duplicating a grid copies its children (same bug the 6b4cfae commit fixed for section/repeater).

## Reuse Notes

- Follow `SectionElement.vue` + `FillSection.vue` as the closest templates for grid's builder/fill components.
- Follow `RepeaterProperties.vue` for the properties panel structure; it already handles grouped sub-settings and color inputs.
- Use the existing `getChildren(clientId)` helper in fill mode, and the existing nested `<draggable>` setup in `ElementWrapper.vue` for the builder.
- Hebrew labels throughout (RTL is already set at the app level).

## Verification

1. `pnpm dev` and open the builder.
2. Drag a **Grid** element onto a blank form. Confirm it appears with the default 2-column desktop layout.
3. Drag several leaf elements (text, number, dropdown) into the grid; confirm they arrange in 2 columns.
4. Try to drag a **section** or **repeater** into the grid → drop is rejected.
5. Try to drag the grid **into** a section or repeater → drop is rejected.
6. Duplicate the grid → children come with it.
7. Delete the grid → children are removed.
8. Open grid properties → change desktop columns to 3, mobile to 1, gap, justify, align. Confirm builder reflects desktop values live.
9. Publish/preview (fill mode): open on a desktop viewport → 3 columns. Resize browser below `md` (≈768px) → collapses to 1 column with mobile gap/justify/align.
10. Run through an existing section+repeater form to confirm nothing about section/repeater drop rules regressed.
