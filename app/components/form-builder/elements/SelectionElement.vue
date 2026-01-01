<script setup lang="ts">
import type { BuilderElement, SelectionOption } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
}

const props = defineProps<Props>();

const config = computed(() => props.element.config as {
	label?: string;
	placeholder?: string;
	helpText?: string;
	options?: SelectionOption[];
	validation?: { required?: boolean };
});

const options = computed(() => config.value.options || []);
</script>

<template>
	<div>
		<label v-if="config.label" class="mb-1 block text-sm font-medium text-gray-700">
			{{ config.label }}
			<span v-if="config.validation?.required" class="text-red-500">*</span>
		</label>

		<!-- Dropdown -->
		<template v-if="element.type === 'dropdown'">
			<select
				disabled
				class="w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
			>
				<option value="">{{ config.placeholder || 'Select an option' }}</option>
				<option v-for="opt in options" :key="opt.id" :value="opt.value">
					{{ opt.label }}
				</option>
			</select>
		</template>

		<!-- Radio buttons -->
		<template v-else-if="element.type === 'radio'">
			<div class="space-y-2">
				<label
					v-for="opt in options"
					:key="opt.id"
					class="flex items-center gap-2"
				>
					<input
						type="radio"
						:name="element.clientId"
						disabled
						class="h-4 w-4 border-gray-300 text-blue-600"
					/>
					<span class="text-sm text-gray-600">{{ opt.label }}</span>
				</label>
			</div>
		</template>

		<!-- Single checkbox -->
		<template v-else-if="element.type === 'checkbox'">
			<label class="flex items-center gap-2">
				<input
					type="checkbox"
					disabled
					class="h-4 w-4 rounded border-gray-300 text-blue-600"
				/>
				<span class="text-sm text-gray-600">{{ config.label }}</span>
			</label>
		</template>

		<!-- Multiple checkboxes -->
		<template v-else-if="element.type === 'checkboxes'">
			<div class="space-y-2">
				<label
					v-for="opt in options"
					:key="opt.id"
					class="flex items-center gap-2"
				>
					<input
						type="checkbox"
						disabled
						class="h-4 w-4 rounded border-gray-300 text-blue-600"
					/>
					<span class="text-sm text-gray-600">{{ opt.label }}</span>
				</label>
			</div>
		</template>

		<p v-if="config.helpText" class="mt-1 text-xs text-gray-500">
			{{ config.helpText }}
		</p>
	</div>
</template>
