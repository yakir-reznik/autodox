# Create New Form Element

Create a new form element type for the Autodox form builder. This guide walks through all the files that need to be created or modified.

## Overview

Form elements in Autodox have several components:
1. **Schema definition** - Element type enum and config type
2. **Default configuration** - Default values when element is created
3. **Palette entry** - How it appears in the element palette
4. **Builder component** - Preview in the form editor (disabled/read-only)
5. **Fill component** - Interactive component for form submission
6. **Property panel** - Configuration UI in the editor sidebar

## Step-by-Step Instructions

### Step 1: Add Element Type to Schema

**File:** `server/db/schema.ts`

Add the new element type to the `elementTypeEnum` array:

```typescript
export const elementTypeEnum = [
  // Input fields
  "text", "email", "number", "textarea", "date", "time", "datetime",
  // Selection fields
  "dropdown", "radio", "checkbox", "checkboxes",
  // Special
  "signature",
  "YOUR_NEW_TYPE",  // <-- Add here
  // Layout
  "heading_h1", "heading_h2", "heading_h3", "paragraph", "image", "video", "divider", "spacer", "section",
] as const;
```

### Step 2: Add Default Configuration

**File:** `app/composables/useElementDefaults.ts`

Add a case in `getDefaultConfig()` function:

```typescript
export function getDefaultConfig(type: ElementType): ElementConfig {
  switch (type) {
    // ... existing cases
    case "YOUR_NEW_TYPE":
      return {
        label: "תווית בעברית",  // Hebrew label
        placeholder: "",
        helpText: "",
        validation: { required: false },
        // Add any type-specific config properties
      };
  }
}
```

### Step 3: Add to Element Palette

**File:** `app/composables/useElementDefaults.ts`

Add entry in `usePaletteElements()` function:

```typescript
export function usePaletteElements(): PaletteElement[] {
  return [
    // ... existing elements
    {
      type: "YOUR_NEW_TYPE",
      label: "שם בעברית",  // Hebrew display name
      icon: "heroicons:icon-name",  // Heroicon name
      category: "input",  // "input" | "selection" | "special" | "layout"
    },
  ];
}
```

### Step 4: Update Component Mapping

**File:** `app/composables/useElementDefaults.ts`

Add case in `getElementComponent()` function:

```typescript
export function getElementComponent(type: ElementType): string {
  switch (type) {
    // ... existing cases
    case "YOUR_NEW_TYPE":
      return "YourNewTypeElement";  // Or use existing like "InputElement"
  }
}
```

### Step 5: Create Builder Component

**File:** `app/components/form-builder/elements/YourNewTypeElement.vue`

Create a preview component (elements are disabled in builder mode):

```vue
<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface YourNewTypeConfig {
  label?: string;
  placeholder?: string;
  helpText?: string;
  // Add type-specific properties
}

const props = defineProps<{
  element: BuilderElement;
}>();

const config = computed(() => props.element.config as YourNewTypeConfig);
</script>

<template>
  <div>
    <label v-if="config.label" class="mb-1 block text-sm font-medium text-gray-700">
      {{ config.label }}
      <span v-if="props.element.isRequired" class="text-red-500">*</span>
    </label>

    <!-- Your element preview (disabled) -->
    <input
      type="text"
      :placeholder="config.placeholder"
      disabled
      class="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
    />

    <p v-if="config.helpText" class="mt-1 text-xs text-gray-500">
      {{ config.helpText }}
    </p>
  </div>
</template>
```

### Step 6: Register Builder Component

**File:** `app/components/form-builder/elements/ElementWrapper.vue`

Import and add to `componentMap`:

```typescript
import YourNewTypeElement from "./YourNewTypeElement.vue";

const componentMap: Record<string, Component> = {
  // ... existing components
  YourNewTypeElement,
};
```

### Step 7: Create Fill Component

**File:** `app/components/form-fill/elements/FillYourNewType.vue`

Create an interactive component for form filling:

```vue
<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface YourNewTypeConfig {
  label?: string;
  placeholder?: string;
  helpText?: string;
  // Add type-specific properties
}

const props = defineProps<{
  element: BuilderElement;
  modelValue?: string;  // Adjust type based on element
  error?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  blur: [];
}>();

const config = computed(() => props.element.config as YourNewTypeConfig);

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
}
</script>

<template>
  <div class="form-fill-field">
    <label v-if="config.label" class="form-fill-label">
      {{ config.label }}
      <span v-if="props.element.isRequired" class="text-red-500">*</span>
    </label>

    <!-- Your interactive element -->
    <input
      type="text"
      :value="modelValue"
      :placeholder="config.placeholder"
      class="form-fill-input"
      :class="{ 'border-red-500': error }"
      @input="handleInput"
      @blur="emit('blur')"
    />

    <p v-if="error" class="form-fill-error">{{ error }}</p>
    <p v-else-if="config.helpText" class="form-fill-help">{{ config.helpText }}</p>
  </div>
</template>
```

### Step 8: Register Fill Component

**File:** `app/components/form-fill/FormField.vue`

Import and add to `getFillComponent()`:

```typescript
import FillYourNewType from "./elements/FillYourNewType.vue";

function getFillComponent(type: string): Component | null {
  switch (type) {
    // ... existing cases
    case "YOUR_NEW_TYPE":
      return FillYourNewType;
  }
}
```

### Step 9: Create Property Panel Component (Optional)

**File:** `app/components/form-builder/properties/YourNewTypeProperties.vue`

If your element has unique configuration options:

```vue
<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface YourNewTypeConfig {
  customOption?: string;
  // Type-specific properties
}

const props = defineProps<{
  element: BuilderElement;
}>();

const emit = defineEmits<{
  "update:config": [config: Partial<YourNewTypeConfig>];
}>();

const config = computed(() => props.element.config as YourNewTypeConfig);
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-sm font-medium text-gray-700">הגדרות מיוחדות</h3>

    <div>
      <label class="mb-1 block text-sm text-gray-600">אפשרות מותאמת</label>
      <BaseInput
        :model-value="config.customOption || ''"
        @update:model-value="emit('update:config', { customOption: $event })"
      />
    </div>
  </div>
</template>
```

### Step 10: Register Property Panel

**File:** `app/components/form-builder/PropertyPanel.vue`

Add the property component to the template:

```vue
<template>
  <!-- ... existing content -->

  <!-- Add your custom properties panel -->
  <FormBuilderPropertiesYourNewTypeProperties
    v-if="element.type === 'YOUR_NEW_TYPE'"
    :element="element"
    @update:config="updateConfig"
  />
</template>
```

### Step 11: Update Helper Functions (If Needed)

**File:** `app/composables/useElementDefaults.ts`

Update helper functions based on element behavior:

```typescript
// If element accepts user input (has a value)
export function isFieldElement(type: ElementType): boolean {
  return ["text", "email", /* ... */, "YOUR_NEW_TYPE"].includes(type);
}

// If element supports validation rules
export function supportsValidation(type: ElementType): boolean {
  return isFieldElement(type);
}

// If element has selection options (dropdown, radio, etc.)
export function hasOptions(type: ElementType): boolean {
  return ["dropdown", "radio", "checkbox", "checkboxes"].includes(type);
}
```

## Element Categories

- **input** - Text inputs, numbers, dates, etc. (user types a value)
- **selection** - Dropdown, radio, checkboxes (user picks from options)
- **special** - Signature, file upload, etc. (unique interaction)
- **layout** - Headings, paragraphs, dividers, sections (no user input)

## Config Patterns

### Field Elements (input, selection)
```typescript
{
  label: string;
  placeholder?: string;
  helpText?: string;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    patternMessage?: string;
  };
}
```

### Layout Elements
```typescript
{
  text?: string;       // For headings/paragraphs
  align?: "left" | "center" | "right";
  // No validation needed
}
```

## Files Summary

| Purpose | File Path |
|---------|-----------|
| Element type enum | `server/db/schema.ts` |
| Default config | `app/composables/useElementDefaults.ts` |
| Palette entry | `app/composables/useElementDefaults.ts` |
| Component mapping | `app/composables/useElementDefaults.ts` |
| Builder component | `app/components/form-builder/elements/YourElement.vue` |
| Builder registration | `app/components/form-builder/elements/ElementWrapper.vue` |
| Fill component | `app/components/form-fill/elements/FillYourElement.vue` |
| Fill registration | `app/components/form-fill/FormField.vue` |
| Property panel | `app/components/form-builder/properties/YourProperties.vue` |
| Property registration | `app/components/form-builder/PropertyPanel.vue` |

## Tips

1. **Reuse existing components** - If your element is similar to an existing one (e.g., a phone input is like a text input), you can reuse `InputElement` in builder and just create a custom fill component.

2. **Use existing property panels** - `BaseProperties` handles label, help text, and name. `ValidationEditor` handles validation rules. Only create custom property panels for unique settings.

3. **Follow RTL patterns** - The app uses Hebrew and RTL layout. Use `text-right` classes and Hebrew labels.

4. **Test in both modes** - Always test your element in:
   - Builder mode (dragging, selecting, editing properties)
   - Fill mode (entering data, validation, submission)
