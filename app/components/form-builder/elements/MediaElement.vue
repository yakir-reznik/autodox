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
</script>

<template>
	<div class="text-center">
		<!-- Image -->
		<template v-if="element.type === 'image'">
			<div
				v-if="config.url"
				class="overflow-hidden rounded-lg"
				:style="{
					maxWidth: config.width ? `${config.width}px` : '100%',
				}"
			>
				<img
					:src="config.url"
					:alt="config.alt"
					class="w-full"
					:style="{ height: config.height ? `${config.height}px` : 'auto' }"
				/>
			</div>
			<div
				v-else
				class="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
			>
				<div class="text-center">
					<Icon name="heroicons:photo" class="mx-auto h-8 w-8 text-gray-400" />
					<p class="mt-1 text-sm text-gray-500">No image URL</p>
				</div>
			</div>
		</template>

		<!-- Video -->
		<template v-else-if="element.type === 'video'">
			<div
				v-if="config.url"
				class="overflow-hidden rounded-lg"
				:style="{
					maxWidth: config.width ? `${config.width}px` : '100%',
				}"
			>
				<video
					:src="config.url"
					controls
					class="w-full"
					:style="{ height: config.height ? `${config.height}px` : 'auto' }"
				/>
			</div>
			<div
				v-else
				class="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
			>
				<div class="text-center">
					<Icon name="heroicons:video-camera" class="mx-auto h-8 w-8 text-gray-400" />
					<p class="mt-1 text-sm text-gray-500">No video URL</p>
				</div>
			</div>
		</template>

		<p v-if="config.caption" class="mt-2 text-sm text-gray-500">
			{{ config.caption }}
		</p>
	</div>
</template>
