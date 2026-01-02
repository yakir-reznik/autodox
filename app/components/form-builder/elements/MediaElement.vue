<script setup lang="ts">
import type { BuilderElement, UploadResponse } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:config": [config: Record<string, any>];
}>();

const config = computed(() => props.element.config as {
	url?: string;
	alt?: string;
	caption?: string;
	width?: number;
	height?: number;
});

// Drag and drop state
const isDragging = ref(false);
const isUploading = ref(false);
const uploadError = ref<string | null>(null);

const handleDragOver = (event: DragEvent) => {
	event.preventDefault();
	isDragging.value = true;
};

const handleDragLeave = () => {
	isDragging.value = false;
};

const handleDrop = async (event: DragEvent) => {
	event.preventDefault();
	isDragging.value = false;

	const file = event.dataTransfer?.files[0];
	if (!file) return;

	// Only allow images for image elements
	if (props.element.type === 'image') {
		const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
		if (!validTypes.includes(file.type)) {
			uploadError.value = 'Invalid file type. Please drop a JPEG, PNG, WebP, or GIF image.';
			return;
		}
	}

	// Validate file size (2MB max)
	const maxSize = 2 * 1024 * 1024; // 2MB
	if (file.size > maxSize) {
		uploadError.value = 'File size exceeds 2MB limit.';
		return;
	}

	uploadError.value = null;
	isUploading.value = true;

	try {
		const formData = new FormData();
		formData.append('file', file);

		const response = await $fetch<UploadResponse>('/api/uploads', {
			method: 'POST',
			body: formData,
		});

		if (response.success && response.upload) {
			emit('update:config', { url: response.upload.url });
		}
	} catch (error: any) {
		uploadError.value = error.data?.message || 'Failed to upload file. Please try again.';
	} finally {
		isUploading.value = false;
	}
};
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
				class="flex h-40 items-center justify-center rounded-lg border-2 border-dashed transition-colors"
				:class="[
					isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50',
					isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400 hover:bg-gray-100'
				]"
				@dragover="handleDragOver"
				@dragleave="handleDragLeave"
				@drop="handleDrop"
			>
				<div class="text-center pointer-events-none">
					<Icon
						v-if="!isUploading"
						name="heroicons:photo"
						class="mx-auto h-8 w-8"
						:class="isDragging ? 'text-blue-500' : 'text-gray-400'"
					/>
					<Icon
						v-else
						name="heroicons:arrow-path"
						class="mx-auto h-8 w-8 text-blue-500 animate-spin"
					/>
					<p class="mt-1 text-sm" :class="isDragging ? 'text-blue-600' : 'text-gray-500'">
						{{ isUploading ? 'Uploading...' : isDragging ? 'Drop image here' : 'Drop image here or use properties panel' }}
					</p>
					<p v-if="uploadError" class="mt-1 text-xs text-red-600">
						{{ uploadError }}
					</p>
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
