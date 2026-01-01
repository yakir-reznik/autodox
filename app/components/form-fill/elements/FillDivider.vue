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

const dividerClass = computed(() => {
	const style = config.value.style || "solid";
	return `form-fill-divider ${style}`;
});

const dividerStyle = computed(() => {
	if (config.value.color) {
		return { borderTopColor: config.value.color };
	}
	return {};
});
</script>

<template>
	<hr :class="dividerClass" :style="dividerStyle" />
</template>
