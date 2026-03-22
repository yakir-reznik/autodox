<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";
import { interpolateFieldValues } from "~/utils/interpolate";

interface Props {
	element: BuilderElement;
	formData: Record<string, any>;
}

const props = defineProps<Props>();

const allElements = inject<ComputedRef<BuilderElement[]>>("formElements");

const config = computed(() => props.element.config as {
	text?: string;
	align?: "left" | "center" | "right";
});

const headingLevel = computed(() => {
	switch (props.element.type) {
		case "heading_h1":
			return "h1";
		case "heading_h2":
			return "h2";
		case "heading_h3":
			return "h3";
		default:
			return "h2";
	}
});

const headingClass = computed(() => {
	const level = props.element.type.replace("heading_", "");
	return `form-fill-heading ${level}`;
});

const alignmentStyle = computed(() => ({
	textAlign: config.value.align || "right",
}));

const resolvedHtml = computed(() => {
	const text = config.value.text || "";
	const interpolated = interpolateFieldValues(text, allElements?.value ?? [], props.formData);
	return linkifyText(interpolated);
});
</script>

<template>
	<component
		:is="headingLevel"
		:class="headingClass"
		:style="alignmentStyle"
		v-html="resolvedHtml"
	/>
</template>
