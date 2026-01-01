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
	<div
		class="relative rounded bg-gray-100"
		:style="spacerStyle"
	>
		<span class="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
			{{ config.height || 24 }}px
		</span>
	</div>
</template>
