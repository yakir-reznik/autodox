<script setup lang="ts">
import type { BuilderElement, SelectionOption } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:config": [config: Record<string, any>];
}>();

const config = computed(() => props.element.config as {
	placeholder?: string;
	options?: SelectionOption[];
	allowOther?: boolean;
});

const options = computed(() => config.value.options || []);

function updateOptions(newOptions: SelectionOption[]) {
	emit("update:config", { options: newOptions });
}
</script>

<template>
	<div class="space-y-4">
		<h3 class="text-sm font-medium text-gray-700">Selection Settings</h3>

		<!-- Placeholder (for dropdown) -->
		<div v-if="element.type === 'dropdown'">
			<label class="mb-1 block text-sm text-gray-600">Placeholder</label>
			<UiInput
				:model-value="config.placeholder || ''"
				placeholder="Select an option..."
				@update:model-value="$emit('update:config', { placeholder: $event })"
			/>
		</div>

		<!-- Options editor -->
		<FormBuilderPropertiesOptionsEditor
			:options="options"
			@update:options="updateOptions"
		/>

		<!-- Allow other -->
		<UiToggle
			:model-value="config.allowOther || false"
			@update:model-value="$emit('update:config', { allowOther: $event })"
		>
			Allow "Other" option
		</UiToggle>
	</div>
</template>
