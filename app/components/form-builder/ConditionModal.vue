<script setup lang="ts">
import type { BuilderElement, ConditionGroup } from "~/types/form-builder";

interface Props {
	modelValue: boolean;
	element: BuilderElement;
	allElements: BuilderElement[];
}

defineProps<Props>();

const emit = defineEmits<{
	"update:modelValue": [value: boolean];
	"update:conditions": [conditions: ConditionGroup];
}>();
</script>

<template>
	<BaseModal :model-value="modelValue" title="לוגיקה מותנית" size="lg" @update:model-value="emit('update:modelValue', $event)">
		<FormBuilderPropertiesConditionEditor
			:element="element"
			:all-elements="allElements"
			@update:conditions="emit('update:conditions', $event)"
		/>
	</BaseModal>
</template>
