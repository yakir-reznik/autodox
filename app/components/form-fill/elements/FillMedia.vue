<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";
import { interpolateRawValues } from "~/utils/interpolate";

interface Props {
	element: BuilderElement;
}

const props = defineProps<Props>();

const allElements = inject<ComputedRef<BuilderElement[]>>("formElements");
const rootFormData = inject<Record<string, any>>("rootFormData", {});
const prefillData = inject<ComputedRef<Record<string, any>>>("prefillData", computed(() => ({})));

const config = computed(() => props.element.config as {
	url?: string;
	alt?: string;
	caption?: string;
	width?: number;
	height?: number;
	align?: "left" | "center" | "right";
});

const alignClass = computed(() => {
	switch (config.value.align) {
		case "left": return "flex flex-col items-end";
		case "right": return "flex flex-col items-start";
		default: return "flex flex-col items-center";
	}
});

const resolvedUrl = computed(() =>
	interpolateRawValues(config.value.url || "", allElements?.value ?? [], rootFormData, prefillData.value),
);

const mediaStyle = computed(() => {
	const style: Record<string, string> = {};
	if (config.value.width) {
		style.width = `${config.value.width}px`;
	}
	if (config.value.height) {
		style.height = `${config.value.height}px`;
	}
	return style;
});

const isVideo = computed(() => props.element.type === "video");
</script>

<template>
	<div v-if="resolvedUrl" :class="alignClass">
		<!-- Video -->
		<template v-if="isVideo">
			<video
				:src="resolvedUrl"
				:style="mediaStyle"
				class="form-fill-media max-w-full rounded-md"
				controls
			/>
		</template>

		<!-- Image -->
		<template v-else>
			<img
				:src="resolvedUrl"
				:alt="config.alt || ''"
				:style="mediaStyle"
				class="form-fill-media max-w-full rounded-md"
			/>
		</template>

		<p v-if="config.caption" class="form-fill-media-caption text-sm text-muted-foreground mt-1 text-center">
			{{ config.caption }}
		</p>
	</div>

	<!-- Empty state -->
	<div v-else class="rounded-lg border-2 border-dashed border-input p-8 text-center text-muted-foreground">
		<Icon :name="isVideo ? 'heroicons:video-camera' : 'heroicons:photo'" class="mx-auto h-8 w-8" />
		<p class="mt-2 text-sm">No {{ isVideo ? 'video' : 'image' }} set</p>
	</div>
</template>
