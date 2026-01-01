<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:name": [name: string];
	"update:config": [config: Record<string, any>];
	"update:required": [required: boolean];
}>();

const config = computed(() => props.element.config as {
	label?: string;
	helpText?: string;
	validation?: { required?: boolean };
});

function updateLabel(label: string) {
	emit("update:config", { label });
}

function updateHelpText(helpText: string) {
	emit("update:config", { helpText });
}
</script>

<template>
	<div class="space-y-4">
		<h3 class="text-sm font-medium text-gray-700">Basic Settings</h3>

		<!-- Field name -->
		<div>
			<label class="mb-1 block text-sm text-gray-600">Field Name</label>
			<UiInput
				:model-value="element.name || ''"
				placeholder="e.g., first_name"
				@update:model-value="$emit('update:name', String($event))"
			/>
			<p class="mt-1 text-xs text-gray-500">Used to identify this field in submissions</p>
		</div>

		<!-- Label -->
		<div>
			<label class="mb-1 block text-sm text-gray-600">Label</label>
			<UiInput
				:model-value="config.label || ''"
				placeholder="Field label"
				@update:model-value="updateLabel($event as string)"
			/>
		</div>

		<!-- Help text -->
		<div>
			<label class="mb-1 block text-sm text-gray-600">Help Text</label>
			<UiInput
				:model-value="config.helpText || ''"
				placeholder="Additional instructions..."
				@update:model-value="updateHelpText($event as string)"
			/>
		</div>

		<!-- Required toggle -->
		<UiToggle
			:model-value="element.isRequired"
			@update:model-value="$emit('update:required', $event)"
		>
			Required field
		</UiToggle>
	</div>
</template>
