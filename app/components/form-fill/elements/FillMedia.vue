<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
}

const props = defineProps<Props>();

const config = computed(() => props.element.config as {
	url?: string;
	alt?: string;
	caption?: string;
	width?: number;
	height?: number;
});

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
	<div v-if="config.url">
		<!-- Video -->
		<template v-if="isVideo">
			<video
				:src="config.url"
				:style="mediaStyle"
				class="form-fill-media max-w-full rounded-md"
				controls
			/>
		</template>

		<!-- Image -->
		<template v-else>
			<img
				:src="config.url"
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
