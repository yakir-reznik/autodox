<template>
	<div class="form-fill-fieldset-checkbox">
		<label
			class="form-fill-checkbox flex items-center gap-2 cursor-pointer"
			:class="{ 'ring-1 ring-destructive rounded-md p-2': error }"
		>
			<input
				type="checkbox"
				:checked="!!modelValue"
				class="h-4 w-4 accent-primary"
				@change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
				@blur="emit('blur')"
			/>
			<span class="text-base text-foreground">
				{{ config.label }}
				<span v-if="isRequired" class="form-fill-required text-destructive ms-0.5">*</span>
			</span>
		</label>

		<p v-if="config.helpText" class="form-fill-help text-sm text-muted-foreground mt-1 ms-6">
			{{ config.helpText }}
		</p>
		<p v-if="error" class="form-fill-error text-sm text-destructive mt-1">{{ error }}</p>
	</div>
</template>

<script setup lang="ts">
	import type { BuilderElement } from "~/types/form-builder";

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

	const config = computed(
		() =>
			props.element.config as {
				label?: string;
				helpText?: string;
				validation?: { required?: boolean };
			},
	);

	const isRequired = computed(
		() =>
			props.element.isRequired ||
			config.value.validation?.required ||
			props.conditionRequired,
	);
</script>
