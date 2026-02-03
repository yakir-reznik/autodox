<script setup lang="ts">
import type { BuilderElement, SelectionOption } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
	modelValue?: string | string[] | boolean;
	error?: string;
	conditionRequired?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:modelValue": [value: string | string[] | boolean];
	blur: [];
}>();

const config = computed(() => props.element.config as {
	label?: string;
	placeholder?: string;
	helpText?: string;
	options?: SelectionOption[];
	validation?: { required?: boolean };
});

const isRequired = computed(() => props.element.isRequired || config.value.validation?.required || props.conditionRequired);

// Handle checkbox group changes
function handleCheckboxChange(optionValue: string, checked: boolean) {
	const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
	if (checked) {
		if (!current.includes(optionValue)) {
			current.push(optionValue);
		}
	} else {
		const index = current.indexOf(optionValue);
		if (index > -1) {
			current.splice(index, 1);
		}
	}
	emit("update:modelValue", current);
}

function isChecked(optionValue: string): boolean {
	return Array.isArray(props.modelValue) && props.modelValue.includes(optionValue);
}
</script>

<template>
	<div>
		<!-- Label (not for single checkbox) -->
		<label v-if="config.label && element.type !== 'checkbox'" class="form-fill-label">
			{{ config.label }}
			<span v-if="isRequired" class="form-fill-required">*</span>
		</label>

		<!-- Dropdown -->
		<select
			v-if="element.type === 'dropdown'"
			:value="modelValue"
			class="form-fill-select"
			@change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
			@blur="emit('blur')"
		>
			<option value="">{{ config.placeholder || 'Select...' }}</option>
			<option v-for="opt in config.options" :key="opt.id" :value="opt.value">
				{{ opt.label }}
			</option>
		</select>

		<!-- Radio buttons -->
		<div v-else-if="element.type === 'radio'" class="form-fill-radio-group">
			<label v-for="opt in config.options" :key="opt.id" class="form-fill-radio-option">
				<input
					type="radio"
					:name="element.clientId"
					:value="opt.value"
					:checked="modelValue === opt.value"
					@change="emit('update:modelValue', opt.value)"
					@blur="emit('blur')"
				/>
				<span>{{ opt.label }}</span>
			</label>
		</div>

		<!-- Single checkbox -->
		<label v-else-if="element.type === 'checkbox'" class="form-fill-checkbox">
			<input
				type="checkbox"
				:checked="!!modelValue"
				@change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
				@blur="emit('blur')"
			/>
			<span>
				{{ config.label }}
				<span v-if="isRequired" class="form-fill-required">*</span>
			</span>
		</label>

		<!-- Multiple checkboxes -->
		<div v-else-if="element.type === 'checkboxes'" class="form-fill-checkbox-group">
			<label v-for="opt in config.options" :key="opt.id" class="form-fill-checkbox-option">
				<input
					type="checkbox"
					:value="opt.value"
					:checked="isChecked(opt.value)"
					@change="handleCheckboxChange(opt.value, ($event.target as HTMLInputElement).checked)"
					@blur="emit('blur')"
				/>
				<span>{{ opt.label }}</span>
			</label>
		</div>

		<p v-if="error" class="form-fill-error">{{ error }}</p>
		<p v-else-if="config.helpText" class="form-fill-help">{{ config.helpText }}</p>
	</div>
</template>
