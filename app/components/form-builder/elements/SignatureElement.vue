<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
}

const props = defineProps<Props>();

const config = computed(() => props.element.config as {
	label?: string;
	helpText?: string;
	maxWidth?: number;
	maxHeight?: number;
	validation?: { required?: boolean };
});
</script>

<template>
	<div>
		<label v-if="config.label" class="mb-1 block text-sm font-medium text-gray-700">
			{{ config.label }}
			<span v-if="config.validation?.required" class="text-red-500">*</span>
		</label>
		<div
			class="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
			:style="{
				width: config.maxWidth ? `${config.maxWidth}px` : '100%',
				height: config.maxHeight ? `${config.maxHeight}px` : '150px',
			}"
		>
			<div class="text-center">
				<Icon name="heroicons:pencil-square" class="mx-auto h-8 w-8 text-gray-400" />
				<p class="mt-1 text-sm text-gray-500">Signature area</p>
			</div>
		</div>
		<p v-if="config.helpText" class="mt-1 text-xs text-gray-500">
			{{ config.helpText }}
		</p>
	</div>
</template>
