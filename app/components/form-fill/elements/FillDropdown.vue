<script setup lang="ts">
import type { BuilderElement, SelectionOption } from "~/types/form-builder";

type Props = {
	element: BuilderElement;
	modelValue?: string | string[] | boolean;
	error?: string;
	conditionRequired?: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:modelValue": [value: string | string[] | boolean];
	blur: [];
}>();

const inputId = useId();

const config = computed(
	() =>
		props.element.config as {
			label?: string;
			placeholder?: string;
			helpText?: string;
			options?: SelectionOption[];
			allowUserOption?: boolean;
			validation?: { required?: boolean };
		},
);

const isRequired = computed(
	() =>
		props.element.isRequired ||
		config.value.validation?.required ||
		props.conditionRequired,
);

const { isOtherSelected, otherText, selectOther, updateOtherText } = useOtherOption(
	computed(() => props.modelValue),
	(v) => emit("update:modelValue", v),
);
</script>

<template>
	<div>
		<label
			v-if="config.label"
			:for="inputId"
			class="form-fill-label block text-sm font-medium text-foreground mb-1"
		>
			{{ config.label }}
			<span v-if="isRequired" class="form-fill-required text-destructive ms-0.5">*</span>
		</label>

		<select
			:id="inputId"
			:value="isOtherSelected ? '__other__' : modelValue"
			class="form-fill-select w-full bg-card border border-input rounded-md py-2 px-4 text-base text-foreground cursor-pointer transition-colors focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/10"
			:class="{ 'border-destructive!': error }"
			@change="
				($event.target as HTMLSelectElement).value === '__other__'
					? selectOther()
					: emit('update:modelValue', ($event.target as HTMLSelectElement).value)
			"
			@blur="emit('blur')"
		>
			<option value="">{{ config.placeholder || "Select..." }}</option>
			<option v-for="opt in config.options" :key="opt.id" :value="opt.value">
				{{ opt.label }}
			</option>
			<option v-if="config.allowUserOption" value="__other__">אחר</option>
		</select>

		<input
			v-if="config.allowUserOption && isOtherSelected"
			type="text"
			:value="otherText"
			class="form-fill-input w-full bg-card border border-input rounded-md py-2 px-4 text-base text-foreground transition-colors focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/10 placeholder:text-muted-foreground mt-2"
			placeholder="פרט..."
			@input="updateOtherText(($event.target as HTMLInputElement).value)"
			@blur="emit('blur')"
		/>

		<p v-if="error" class="form-fill-error text-sm text-destructive mt-1">{{ error }}</p>
		<p v-else-if="config.helpText" class="form-fill-help text-sm text-muted-foreground mt-1">
			{{ config.helpText }}
		</p>
	</div>
</template>
