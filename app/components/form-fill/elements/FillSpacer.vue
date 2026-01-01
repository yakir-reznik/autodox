<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
}

const props = defineProps<Props>();

const config = computed(() => props.element.config as {
	height?: number;
});

const spacerStyle = computed(() => ({
	height: `${config.value.height || 24}px`,
}));
</script>

<template>
	<div :style="spacerStyle" />
</template>
