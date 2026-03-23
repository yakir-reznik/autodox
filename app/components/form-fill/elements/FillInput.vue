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
	defaultValue?: string;
	autocomplete?: string;
	validation?: { required?: boolean };
});


const inputType = computed(() => {
	switch (props.element.type) {
		case "email":
			return "email";
		case "number":
			return "number";
		case "phone":
			return "tel";
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

function sanitizePhone(raw: string): string {
	let result = "";
	for (let i = 0; i < raw.length; i++) {
		const ch = raw[i]!;
		if (ch >= "0" && ch <= "9") {
			result += ch;
		} else if (ch === "+" && result === "") {
			result += ch;
		}
		// spaces, dashes, dots, and other chars are silently ignored
	}
	return result;
}

function handleInput(event: Event) {
	const target = event.target as HTMLInputElement;
	if (props.element.type === "phone") {
		const sanitized = sanitizePhone(target.value);
		target.value = sanitized;
		emit("update:modelValue", sanitized);
		return;
	}
	const value = props.element.type === "number" ? parseFloat(target.value) || 0 : target.value;
	emit("update:modelValue", value);
}

function handlePhoneBlur(event: Event) {
	const target = event.target as HTMLInputElement;
	const sanitized = sanitizePhone(target.value);
	target.value = sanitized;
	emit("update:modelValue", sanitized);
	emit("blur");
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
			:autocomplete="config.autocomplete || 'off'"
			:dir="element.type === 'phone' ? 'ltr' : undefined"
			class="form-fill-input"
			@input="handleInput"
			@blur="element.type === 'phone' ? handlePhoneBlur($event) : emit('blur')"
		/>
		<p v-if="error" class="form-fill-error">{{ error }}</p>
		<p v-else-if="config.helpText" class="form-fill-help">{{ config.helpText }}</p>
	</div>
</template>
