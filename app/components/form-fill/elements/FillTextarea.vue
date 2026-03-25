<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
	modelValue?: string;
	error?: string;
	conditionRequired?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:modelValue": [value: string];
	blur: [];
}>();

const inputId = useId();

const config = computed(() => props.element.config as {
	label?: string;
	placeholder?: string;
	helpText?: string;
	rows?: number;
	defaultValue?: string;
	autocomplete?: string;
	validation?: { required?: boolean };
});

const isRequired = computed(() => props.element.isRequired || config.value.validation?.required || props.conditionRequired);

function handleInput(event: Event) {
	const target = event.target as HTMLTextAreaElement;
	emit("update:modelValue", target.value);
}
</script>

<template>
	<div>
		<label v-if="config.label" :for="inputId" class="form-fill-label block text-sm font-medium text-foreground mb-1">
			{{ config.label }}
			<span v-if="isRequired" class="form-fill-required text-destructive ms-0.5">*</span>
		</label>
		<textarea
			:id="inputId"
			:value="modelValue"
			:placeholder="config.placeholder"
			:rows="config.rows || 4"
			:autocomplete="config.autocomplete || 'off'"
			class="form-fill-textarea w-full bg-card border border-input rounded-md py-2 px-4 text-base text-foreground resize-y min-h-[100px] transition-colors focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/10 placeholder:text-muted-foreground"
			:class="{ '!border-destructive': error }"
			@input="handleInput"
			@blur="emit('blur')"
		/>
		<p v-if="error" class="form-fill-error text-sm text-destructive mt-1">{{ error }}</p>
		<p v-else-if="config.helpText" class="form-fill-help text-sm text-muted-foreground mt-1">{{ config.helpText }}</p>
	</div>
</template>
