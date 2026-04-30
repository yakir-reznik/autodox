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
const prefillData = inject<ComputedRef<Record<string, any>>>("prefillData", computed(() => ({})));

const config = computed(() => props.element.config as {
	text?: string;
	align?: "left" | "center" | "right";
});

const alignmentStyle = computed(() => ({
	textAlign: config.value.align || "right",
}));

const resolvedHtml = computed(() => {
	const text = config.value.text || "";
	const interpolated = interpolateFieldValues(text, allElements?.value ?? [], rootFormData, prefillData.value);
	return linkifyText(interpolated);
});
</script>

<template>
	<p class="form-fill-paragraph text-base text-muted-foreground leading-relaxed whitespace-pre-wrap" :style="alignmentStyle" v-html="resolvedHtml" />
</template>
