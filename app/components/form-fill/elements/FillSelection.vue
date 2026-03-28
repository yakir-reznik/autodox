<script setup lang="ts">
	import type { BuilderElement } from "~/types/form-builder";

	type Props = {
		element: BuilderElement;
		modelValue?: string | string[] | boolean;
		error?: string;
		conditionRequired?: boolean;
	};

	defineProps<Props>();

	const emit = defineEmits<{
		"update:modelValue": [value: string | string[] | boolean];
		blur: [];
	}>();
</script>

<template>
	<FormFillElementsFillDropdown
		v-if="element.type === 'dropdown'"
		v-bind="$props"
		@update:modelValue="emit('update:modelValue', $event)"
		@blur="emit('blur')"
	/>
	<FormFillElementsFillRadio
		v-else-if="element.type === 'radio'"
		v-bind="$props"
		@update:modelValue="emit('update:modelValue', $event)"
		@blur="emit('blur')"
	/>
	<FormFillElementsFillCheckbox
		v-else-if="element.type === 'checkbox'"
		v-bind="$props"
		@update:modelValue="emit('update:modelValue', $event)"
		@blur="emit('blur')"
	/>
	<FormFillElementsFillCheckboxes
		v-else-if="element.type === 'checkboxes'"
		v-bind="$props"
		@update:modelValue="emit('update:modelValue', $event)"
		@blur="emit('blur')"
	/>
</template>
