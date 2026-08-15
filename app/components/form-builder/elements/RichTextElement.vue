<script setup lang="ts">
	import type { BuilderElement } from "~/types/form-builder";

	interface Props {
		element: BuilderElement;
	}

	const props = defineProps<Props>();

	const config = computed(
		() =>
			props.element.config as {
				html?: string;
				align?: "left" | "center" | "right";
			},
	);

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

	const html = computed(() =>
		sanitizeRichTextHtml(config.value.html || "<p>הזן את הטקסט שלך כאן...</p>"),
	);
</script>

<template>
	<div
		class="text-gray-600 [&_a]:text-primary [&_a]:underline [&_div]:mb-2 [&_div:last-child]:mb-0 [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pe-0 [&_ol]:ps-4 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pe-0 [&_ul]:ps-4"
		:class="alignClass"
		v-html="html"
	/>
</template>
