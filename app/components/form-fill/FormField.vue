<script setup lang="ts">
	import type { BuilderElement } from "~/types/form-builder";
	import { isFieldElement } from "~/composables/useElementDefaults";
	import FillInput from "./elements/FillInput.vue";
	import FillTextarea from "./elements/FillTextarea.vue";
	import FillSelection from "./elements/FillSelection.vue";
	import FillSignature from "./elements/FillSignature.vue";
	import FillHeading from "./elements/FillHeading.vue";
	import FillParagraph from "./elements/FillParagraph.vue";
	import FillMedia from "./elements/FillMedia.vue";
	import FillDivider from "./elements/FillDivider.vue";
	import FillSpacer from "./elements/FillSpacer.vue";
	import FillSection from "./elements/FillSection.vue";
	import FillRepeater from "./elements/FillRepeater.vue";

	interface Props {
		element: BuilderElement;
		getChildren: (parentClientId: string) => BuilderElement[];
		modelValue?: any;
		error?: string;
		formData: Record<string, any>;
		errors: Record<string, string>;
	}

	const props = defineProps<Props>();

	const emit = defineEmits<{
		"update:modelValue": [value: any];
		blur: [];
	}>();

	// Determine if this element is an input field
	const isField = computed(() => isFieldElement(props.element.type));

	// Get the component name for this element type
	function getFillComponent(type: string) {
		switch (type) {
			case "text":
			case "email":
			case "number":
			case "date":
			case "time":
			case "datetime":
				return FillInput;
			case "textarea":
				return FillTextarea;
			case "dropdown":
			case "radio":
			case "checkbox":
			case "checkboxes":
				return FillSelection;
			case "signature":
				return FillSignature;
			case "heading_h1":
			case "heading_h2":
			case "heading_h3":
				return FillHeading;
			case "paragraph":
				return FillParagraph;
			case "image":
			case "video":
				return FillMedia;
			case "divider":
				return FillDivider;
			case "spacer":
				return FillSpacer;
			case "section":
				return FillSection;
			case "repeater":
				return FillRepeater;
			default:
				return "";
		}
	}

	const componentName = computed(() => getFillComponent(props.element.type));
</script>

<template>
	<div class="form-fill-field" :class="{ 'has-error': error }" :data-field-id="element.clientId">
		<component
			:is="componentName"
			:element="element"
			:model-value="modelValue"
			:error="error"
			:get-children="getChildren"
			:form-data="formData"
			:errors="errors"
			@update:model-value="emit('update:modelValue', $event)"
			@blur="emit('blur')"
		/>
	</div>
</template>
