# Improve Drag-and-Drop Visual Feedback

## Problem
When dragging from the palette to the canvas, the ghost element (placeholder showing where the item will land) is a DOM clone of the small palette card (icon + label). It looks out of place among full-width canvas elements, and `opacity-50` makes it nearly invisible. Users can't tell where an element will land.

## Solution
Use SortableJS's built-in `.sortable-ghost` and `.sortable-drag` classes to style the ghost as a clear insertion indicator (blue dashed rectangle) and give the dragged element a "lift" effect. Pure CSS — no JS changes to drag logic, no changes to data structure.

## Files to Modify

1. `app/assets/css/main.css` — add drag-and-drop styles
2. `app/components/form-builder/FormCanvas.vue` — remove `ghost-class="opacity-50"`
3. `app/components/form-builder/elements/ElementWrapper.vue` — remove `ghost-class="opacity-50"`
4. `app/components/form-builder/properties/OptionsEditor.vue` — remove `ghost-class="opacity-50"`

## Steps

### Step 1: Add drag-and-drop CSS to `app/assets/css/main.css`

Append the following at the end of the file:

```css
/* Form Builder Drag & Drop */

.sortable-ghost {
  opacity: 1 !important;
  background: #eff6ff !important;
  border: 2px dashed #3b82f6 !important;
  border-radius: 0.5rem;
  min-height: 3rem;
  overflow: hidden;
}

.sortable-ghost > * {
  opacity: 0 !important;
}

.sortable-drag {
  opacity: 0.85 !important;
  box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.2) !important;
  transform: rotate(1.5deg);
  z-index: 9999 !important;
}
```

- Ghost hides its original content (palette card clone) and shows as a blue dashed box
- Existing `animation="200"` on the draggable components smoothly shifts elements apart
- Drag element gets a lifted shadow + slight rotation

### Step 2: Remove `ghost-class="opacity-50"` from 3 components

Remove the `ghost-class` prop from `<draggable>` in:
- `FormCanvas.vue` line 75
- `ElementWrapper.vue` line 184
- `OptionsEditor.vue` line 59

The global `.sortable-ghost` CSS now handles all ghost styling. Keeping the old prop would add a conflicting `opacity-50` class.

## Verification

1. Run `pnpm dev`
2. Open form builder, drag a palette item to an empty canvas — should see blue dashed rectangle as insertion indicator
3. Add 3+ elements, drag a new palette item between them — elements should shift apart smoothly, blue indicator visible between them
4. Reorder existing canvas elements via drag handle — same blue indicator behavior
5. Drag into a section/repeater container — indicator appears inside the container
6. In properties panel, reorder options in a selection element — indicator appears between options
7. Verify dropped elements render correctly (data structure unchanged)
