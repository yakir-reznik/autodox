<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface RepeaterConfig {
	label?: string;
	helpText?: string;
	itemName?: string;
	minItems?: number;
	maxItems?: number;
	addButtonText?: string;
	bordered?: boolean;
	backgroundColor?: string;
}

interface Props {
	element: BuilderElement;
}

const props = defineProps<Props>();

const config = computed(() => props.element.config as RepeaterConfig);

// Display info about limits
const limitsText = computed(() => {
	const min = config.value.minItems ?? 1;
	const max = config.value.maxItems;

	if (max !== undefined && min === max) {
		return `${min} פריטים קבועים`;
	}
	if (max !== undefined) {
		return `${min}-${max} פריטים`;
	}
	if (min > 0) {
		return `מינימום ${min} פריטים`;
	}
	return "";
});
</script>

<template>
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<label v-if="config.label" class="text-sm font-medium text-gray-700">
				{{ config.label }}
			</label>
			<span v-if="limitsText" class="text-xs text-gray-500">
				{{ limitsText }}
			</span>
		</div>

		<p v-if="config.helpText" class="text-xs text-gray-500">
			{{ config.helpText }}
		</p>

		<!-- Slot for nested elements (rendered by ElementWrapper) -->
		<slot />
	</div>
</template>
