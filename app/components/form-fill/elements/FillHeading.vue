<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";
import { interpolateFieldValues } from "~/utils/interpolate";

interface Props {
	element: BuilderElement;
	formData: Record<string, any>;
}

const props = defineProps<Props>();

const allElements = inject<ComputedRef<BuilderElement[]>>("formElements");
const rootFormData = inject<Record<string, any>>("rootFormData", {});

const config = computed(() => props.element.config as {
	text?: string;
	align?: "left" | "center" | "right";
});

const sizeClass = computed(() => {
	switch (props.element.type) {
		case "heading_h1": return "text-3xl";
		case "heading_h2": return "text-2xl";
		case "heading_h3": return "text-xl";
		default: return "text-xl";
	}
});

const headingClass = computed(() => {
	const level = props.element.type.replace("heading_", "");
	return `form-fill-heading ${level} ${sizeClass.value} font-semibold text-foreground`;
});

const alignmentStyle = computed(() => ({
	textAlign: config.value.align || "right",
}));

const resolvedHtml = computed(() => {
	const text = config.value.text || "";
	const interpolated = interpolateFieldValues(text, allElements?.value ?? [], rootFormData);
	return linkifyText(interpolated);
});
</script>

<template>
	<h1 v-if="element.type === 'heading_h1'" :class="headingClass" :style="alignmentStyle" v-html="resolvedHtml" />
	<h2 v-else-if="element.type === 'heading_h2'" :class="headingClass" :style="alignmentStyle" v-html="resolvedHtml" />
	<h3 v-else :class="headingClass" :style="alignmentStyle" v-html="resolvedHtml" />
</template>
