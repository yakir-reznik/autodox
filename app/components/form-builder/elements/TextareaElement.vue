<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
}

const props = defineProps<Props>();

const config = computed(() => props.element.config as {
	label?: string;
	placeholder?: string;
	helpText?: string;
	rows?: number;
	validation?: { required?: boolean };
});
</script>

<template>
	<div>
		<label v-if="config.label" class="mb-1 block text-sm font-medium text-gray-700">
			{{ config.label }}
			<span v-if="config.validation?.required" class="text-red-500">*</span>
		</label>
		<textarea
			:placeholder="config.placeholder"
			:rows="config.rows || 4"
			disabled
			class="w-full resize-y rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
		/>
		<p v-if="config.helpText" class="mt-1 text-xs text-gray-500">
			{{ config.helpText }}
		</p>
	</div>
</template>
