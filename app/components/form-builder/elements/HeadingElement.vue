<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
}

const props = defineProps<Props>();

const config = computed(() => props.element.config as {
	text?: string;
	align?: "left" | "center" | "right";
});

const headingClass = computed(() => {
	switch (props.element.type) {
		case "heading_h1":
			return "text-2xl font-bold";
		case "heading_h2":
			return "text-xl font-semibold";
		case "heading_h3":
			return "text-lg font-medium";
		default:
			return "text-lg font-medium";
	}
});

const alignClass = computed(() => {
	switch (config.value.align) {
		case "left":
			return "text-left";
		case "center":
			return "text-center";
		case "right":
			return "text-right";
		default:
			return "text-right";
	}
});
</script>

<template>
	<component
		:is="element.type === 'heading_h1' ? 'h1' : element.type === 'heading_h2' ? 'h2' : 'h3'"
		class="text-gray-900"
		:class="[headingClass, alignClass]"
	>
		{{ config.text || 'Heading' }}
	</component>
</template>
