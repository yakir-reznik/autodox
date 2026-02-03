<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";
import { isFieldElement, supportsValidation, hasOptions } from "~/composables/useElementDefaults";

interface Props {
	element: BuilderElement;
	allElements: BuilderElement[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
	update: [updates: Partial<BuilderElement>];
	close: [];
	editConditions: [];
}>();

// Element type display name
const elementTypeName = computed(() => {
	const typeNames: Record<string, string> = {
		text: "Text Field",
		email: "Email Field",
		number: "Number Field",
		textarea: "Text Area",
		date: "Date Picker",
		time: "Time Picker",
		datetime: "Date & Time",
		dropdown: "Dropdown",
		radio: "Radio Buttons",
		checkbox: "Checkbox",
		checkboxes: "Checkboxes",
		signature: "Signature",
		repeater: "Repeater",
		heading_h1: "Heading 1",
		heading_h2: "Heading 2",
		heading_h3: "Heading 3",
		paragraph: "Paragraph",
		image: "Image",
		video: "Video",
		divider: "Divider",
		spacer: "Spacer",
		section: "Section",
	};
	return typeNames[props.element.type] || props.element.type;
});

// Update handlers
function updateName(name: string) {
	emit("update", { name });
}

function updateConfig(configUpdates: Record<string, any>) {
	emit("update", {
		config: { ...props.element.config, ...configUpdates },
	});
}

function updateRequired(isRequired: boolean) {
	emit("update", { isRequired });
	// Also update in config for convenience
	const config = props.element.config as any;
	if (config.validation) {
		updateConfig({ validation: { ...config.validation, required: isRequired } });
	}
}

</script>

<template>
	<div class="p-4">
		<!-- Header -->
		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-gray-900">{{ elementTypeName }}</h2>
			<button
				class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
				@click="$emit('close')"
			>
				<Icon name="heroicons:x-mark" class="h-5 w-5" />
			</button>
		</div>

		<div class="space-y-6">
			<!-- Base properties (for fields) -->
			<FormBuilderPropertiesBaseProperties
				v-if="isFieldElement(element.type)"
				:element="element"
				@update:name="updateName"
				@update:config="updateConfig"
				@update:required="updateRequired"
			/>

			<!-- Input-specific properties -->
			<FormBuilderPropertiesInputProperties
				v-if="['text', 'email', 'number', 'textarea', 'date', 'time', 'datetime'].includes(element.type)"
				:element="element"
				@update:config="updateConfig"
			/>

			<!-- Selection properties (options) -->
			<FormBuilderPropertiesSelectionProperties
				v-if="hasOptions(element.type)"
				:element="element"
				@update:config="updateConfig"
			/>

			<!-- Layout properties -->
			<FormBuilderPropertiesLayoutProperties
				v-if="!isFieldElement(element.type) && element.type !== 'repeater'"
				:element="element"
				@update:config="updateConfig"
			/>

			<!-- Repeater properties -->
			<FormBuilderPropertiesRepeaterProperties
				v-if="element.type === 'repeater'"
				:element="element"
				@update:config="updateConfig"
				@update:name="updateName"
			/>

			<!-- Validation editor -->
			<FormBuilderPropertiesValidationEditor
				v-if="supportsValidation(element.type)"
				:element="element"
				@update:config="updateConfig"
			/>

			<!-- Conditional logic button -->
			<div class="space-y-2">
				<button
					class="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors"
					:class="
						element.conditions?.enabled && element.conditions.rules.length > 0
							? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
							: 'border-gray-200 text-gray-700 hover:bg-gray-50'
					"
					@click="$emit('editConditions')"
				>
					<span class="flex items-center gap-2">
						<Icon name="heroicons:bolt" class="h-4 w-4" />
						לוגיקה מותנית
					</span>
					<span
						v-if="element.conditions?.enabled && element.conditions.rules.length > 0"
						class="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800"
					>
						{{ element.conditions.rules.length }}
					</span>
				</button>
			</div>
		</div>
	</div>
</template>
