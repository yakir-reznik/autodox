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
	<p class="text-gray-600" :class="alignClass">
		{{ config.text || 'Enter your text here...' }}
	</p>
</template>
