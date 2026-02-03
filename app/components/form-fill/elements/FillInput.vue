<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
	modelValue?: string | number;
	error?: string;
	conditionRequired?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:modelValue": [value: string | number];
	blur: [];
}>();

const config = computed(() => props.element.config as {
	label?: string;
	placeholder?: string;
	helpText?: string;
	step?: number;
	validation?: { required?: boolean };
});

const inputType = computed(() => {
	switch (props.element.type) {
		case "email":
			return "email";
		case "number":
			return "number";
		case "date":
			return "date";
		case "time":
			return "time";
		case "datetime":
			return "datetime-local";
		default:
			return "text";
	}
});

const isRequired = computed(() => props.element.isRequired || config.value.validation?.required || props.conditionRequired);

function handleInput(event: Event) {
	const target = event.target as HTMLInputElement;
	const value = props.element.type === "number" ? parseFloat(target.value) || 0 : target.value;
	emit("update:modelValue", value);
}
</script>

<template>
	<div>
		<label v-if="config.label" class="form-fill-label">
			{{ config.label }}
			<span v-if="isRequired" class="form-fill-required">*</span>
		</label>
		<input
			:type="inputType"
			:value="modelValue"
			:placeholder="config.placeholder"
			:step="config.step"
			class="form-fill-input"
			@input="handleInput"
			@blur="emit('blur')"
		/>
		<p v-if="error" class="form-fill-error">{{ error }}</p>
		<p v-else-if="config.helpText" class="form-fill-help">{{ config.helpText }}</p>
	</div>
</template>
