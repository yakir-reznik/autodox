<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
	modelValue?: string;
	error?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:modelValue": [value: string];
	blur: [];
}>();

const config = computed(() => props.element.config as {
	label?: string;
	placeholder?: string;
	helpText?: string;
	rows?: number;
	validation?: { required?: boolean };
});

const isRequired = computed(() => props.element.isRequired || config.value.validation?.required);

function handleInput(event: Event) {
	const target = event.target as HTMLTextAreaElement;
	emit("update:modelValue", target.value);
}
</script>

<template>
	<div>
		<label v-if="config.label" class="form-fill-label">
			{{ config.label }}
			<span v-if="isRequired" class="form-fill-required">*</span>
		</label>
		<textarea
			:value="modelValue"
			:placeholder="config.placeholder"
			:rows="config.rows || 4"
			class="form-fill-textarea"
			@input="handleInput"
			@blur="emit('blur')"
		/>
		<p v-if="error" class="form-fill-error">{{ error }}</p>
		<p v-else-if="config.helpText" class="form-fill-help">{{ config.helpText }}</p>
	</div>
</template>
