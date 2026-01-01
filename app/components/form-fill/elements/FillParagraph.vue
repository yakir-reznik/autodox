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

const alignmentStyle = computed(() => ({
	textAlign: config.value.align || "right",
}));
</script>

<template>
	<p class="form-fill-paragraph" :style="alignmentStyle">
		{{ config.text }}
	</p>
</template>
