<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:config": [config: Record<string, any>];
}>();

const config = computed(() => props.element.config as {
	placeholder?: string;
	rows?: number;
	step?: number;
});
</script>

<template>
	<div class="space-y-4">
		<h3 class="text-sm font-medium text-gray-700">Input Settings</h3>

		<!-- Placeholder -->
		<div>
			<label class="mb-1 block text-sm text-gray-600">Placeholder</label>
			<UiInput
				:model-value="config.placeholder || ''"
				placeholder="Placeholder text..."
				@update:model-value="$emit('update:config', { placeholder: $event })"
			/>
		</div>

		<!-- Rows (for textarea) -->
		<div v-if="element.type === 'textarea'">
			<label class="mb-1 block text-sm text-gray-600">Rows</label>
			<UiInput
				type="number"
				:model-value="config.rows || 4"
				@update:model-value="$emit('update:config', { rows: Number($event) })"
			/>
		</div>

		<!-- Step (for number) -->
		<div v-if="element.type === 'number'">
			<label class="mb-1 block text-sm text-gray-600">Step</label>
			<UiInput
				type="number"
				:model-value="config.step || 1"
				@update:model-value="$emit('update:config', { step: Number($event) })"
			/>
		</div>
	</div>
</template>
