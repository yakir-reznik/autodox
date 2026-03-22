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
	<p class="form-fill-paragraph" :style="alignmentStyle" v-html="resolvedHtml" />
</template>
