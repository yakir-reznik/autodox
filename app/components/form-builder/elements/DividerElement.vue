<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
}

const props = defineProps<Props>();

const config = computed(() => props.element.config as {
	style?: "solid" | "dashed" | "dotted";
	color?: string;
});

const borderStyle = computed(() => {
	return {
		borderStyle: config.value.style || "solid",
		borderColor: config.value.color || "#e5e7eb",
	};
});
</script>

<template>
	<hr class="border-t" :style="borderStyle" />
</template>
