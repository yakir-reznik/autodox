<script setup lang="ts">
	import type { BuilderElement } from "~/types/form-builder";

	interface Props {
		element: BuilderElement;
	}

	defineProps<Props>();
	// Children are rendered by ElementWrapper (which applies the responsive grid layout).
	// This component only exists so the element-component map resolves correctly.
</script>

<template>
	<div />
</template>
