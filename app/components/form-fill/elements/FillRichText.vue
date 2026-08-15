<script setup lang="ts">
	import type { BuilderElement } from "~/types/form-builder";

	interface Props {
		element: BuilderElement;
		formData: Record<string, any>;
	}

	const props = defineProps<Props>();

	const allElements = inject<ComputedRef<BuilderElement[]>>("formElements");
	const rootFormData = inject<Record<string, any>>("rootFormData", {});
	const prefillData = inject<ComputedRef<Record<string, any>>>(
		"prefillData",
		computed(() => ({})),
	);

	const config = computed(
		() =>
			props.element.config as {
				html?: string;
				align?: "left" | "center" | "right";
			},
	);

	const alignmentStyle = computed(() => ({
		textAlign: config.value.align || "right",
	}));

	const html = computed(() =>
		interpolateRichTextHtml(
			config.value.html || "",
			allElements?.value ?? [],
			rootFormData,
			prefillData.value,
		),
	);
</script>

<template>
	<div
		class="form-fill-rich-text text-base leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_div]:mb-2 [&_div:last-child]:mb-0 [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pe-0 [&_ol]:ps-[var(--fill-rich-text-list-indent,1rem)] [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pe-0 [&_ul]:ps-[var(--fill-rich-text-list-indent,1rem)]"
		:style="alignmentStyle"
		v-html="html"
	/>
</template>
