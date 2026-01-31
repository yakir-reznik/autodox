<script setup lang="ts">
	import type { BuilderElement } from "~/types/form-builder";

	interface Props {
		element: BuilderElement;
	}

	const props = defineProps<Props>();

	const emit = defineEmits<{
		"update:config": [config: Record<string, any>];
	}>();

	const config = computed(
		() =>
			props.element.config as {
				placeholder?: string;
				pattern?: string;
				rows?: number;
				step?: number;
			},
	);
</script>

<template>
	<div class="space-y-4">
		<h3 class="text-sm font-medium text-gray-700">Input Settings</h3>

		<!-- Placeholder -->
		<div>
			<label class="mb-1 block text-sm text-gray-600">Placeholder</label>
			<BaseInput
				:model-value="config.placeholder || ''"
				placeholder="Placeholder text..."
				@update:model-value="$emit('update:config', { placeholder: $event })"
			/>
		</div>

		<!-- Pattern (for email, text, etc.) -->
		<div v-if="['email', 'text'].includes(element.type)">
			<label class="mb-1 block text-sm text-gray-600">Pattern</label>
			<BaseInput
				:model-value="config.pattern || ''"
				placeholder="Regex pattern..."
				@update:model-value="$emit('update:config', { pattern: $event })"
			/>
			<p v-if="element.type === 'email'" class="mt-1 text-xs text-gray-500">
				Default: [a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}
			</p>
		</div>

		<!-- Rows (for textarea) -->
		<div v-if="element.type === 'textarea'">
			<label class="mb-1 block text-sm text-gray-600">Rows</label>
			<BaseInput
				type="number"
				:model-value="config.rows || 4"
				@update:model-value="$emit('update:config', { rows: Number($event) })"
			/>
		</div>

		<!-- Step (for number) -->
		<div v-if="element.type === 'number'">
			<label class="mb-1 block text-sm text-gray-600">Step</label>
			<BaseInput
				type="number"
				:model-value="config.step || 1"
				@update:model-value="$emit('update:config', { step: Number($event) })"
			/>
		</div>
	</div>
</template>
