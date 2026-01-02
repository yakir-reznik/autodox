<script setup lang="ts">
import type { BuilderElement, UploadResponse } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:config": [config: Record<string, any>];
}>();

const config = computed(() => props.element.config as Record<string, any>);

const alignOptions = [
	{ label: "Left", value: "left" },
	{ label: "Center", value: "center" },
	{ label: "Right", value: "right" },
];

const dividerStyles = [
	{ label: "Solid", value: "solid" },
	{ label: "Dashed", value: "dashed" },
	{ label: "Dotted", value: "dotted" },
];

// File upload state
const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const uploadError = ref<string | null>(null);

const handleFileSelect = async (event: Event) => {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];

	if (!file) return;

	// Validate file type (images only for image elements)
	if (props.element.type === 'image') {
		const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
		if (!validTypes.includes(file.type)) {
			uploadError.value = 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.';
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
			// Update the URL in the config
			emit('update:config', { url: response.upload.url });
		}
	} catch (error: any) {
		uploadError.value = error.data?.message || 'Failed to upload file. Please try again.';
	} finally {
		isUploading.value = false;
		// Reset file input
		if (input) input.value = '';
	}
};

const triggerFileInput = () => {
	fileInput.value?.click();
};
</script>

<template>
	<div class="space-y-4">
		<h3 class="text-sm font-medium text-gray-700">Settings</h3>

		<!-- Heading / Paragraph text -->
		<div v-if="['heading_h1', 'heading_h2', 'heading_h3', 'paragraph'].includes(element.type)">
			<label class="mb-1 block text-sm text-gray-600">Text</label>
			<UiTextarea
				:model-value="config.text || ''"
				:rows="element.type === 'paragraph' ? 4 : 2"
				@update:model-value="$emit('update:config', { text: $event })"
			/>
		</div>

		<!-- Text alignment -->
		<div v-if="['heading_h1', 'heading_h2', 'heading_h3', 'paragraph'].includes(element.type)">
			<label class="mb-1 block text-sm text-gray-600">Alignment</label>
			<UiSelect
				:model-value="config.align || 'right'"
				:options="alignOptions"
				@update:model-value="$emit('update:config', { align: $event })"
			/>
		</div>

		<!-- Media Upload (Image only) -->
		<div v-if="element.type === 'image'">
			<label class="mb-1 block text-sm text-gray-600">Upload Image</label>
			<input
				ref="fileInput"
				type="file"
				accept="image/jpeg,image/png,image/webp,image/gif"
				class="hidden"
				@change="handleFileSelect"
			/>
			<div class="flex gap-2">
				<button
					type="button"
					class="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					:disabled="isUploading"
					@click="triggerFileInput"
				>
					<Icon
						v-if="!isUploading"
						name="heroicons:arrow-up-tray"
						class="h-4 w-4"
					/>
					<Icon
						v-else
						name="heroicons:arrow-path"
						class="h-4 w-4 animate-spin"
					/>
					{{ isUploading ? 'Uploading...' : 'Choose Image' }}
				</button>
				<button
					v-if="config.url"
					type="button"
					class="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
					:disabled="isUploading"
					@click="$emit('update:config', { url: '' })"
					title="Clear image"
				>
					<Icon name="heroicons:trash" class="h-4 w-4" />
				</button>
			</div>
			<p v-if="uploadError" class="mt-1 text-xs text-red-600">
				{{ uploadError }}
			</p>
			<p class="mt-1 text-xs text-gray-500">
				Max 2MB. Formats: JPEG, PNG, WebP, GIF
			</p>
		</div>

		<!-- Media URL -->
		<div v-if="['image', 'video'].includes(element.type)">
			<label class="mb-1 block text-sm text-gray-600">URL</label>
			<UiInput
				:model-value="config.url || ''"
				placeholder="https://..."
				@update:model-value="$emit('update:config', { url: $event })"
			/>
			<p class="mt-1 text-xs text-gray-500">
				Or enter external URL
			</p>
		</div>

		<!-- Image alt text -->
		<div v-if="element.type === 'image'">
			<label class="mb-1 block text-sm text-gray-600">Alt Text</label>
			<UiInput
				:model-value="config.alt || ''"
				placeholder="Image description..."
				@update:model-value="$emit('update:config', { alt: $event })"
			/>
		</div>

		<!-- Media caption -->
		<div v-if="['image', 'video'].includes(element.type)">
			<label class="mb-1 block text-sm text-gray-600">Caption</label>
			<UiInput
				:model-value="config.caption || ''"
				placeholder="Optional caption..."
				@update:model-value="$emit('update:config', { caption: $event })"
			/>
		</div>

		<!-- Media width -->
		<div v-if="['image', 'video'].includes(element.type)">
			<label class="mb-1 block text-sm text-gray-600">Max Width (px)</label>
			<UiInput
				type="number"
				:model-value="config.width || ''"
				placeholder="Auto"
				@update:model-value="$emit('update:config', { width: $event ? Number($event) : undefined })"
			/>
		</div>

		<!-- Media height -->
		<div v-if="['image', 'video'].includes(element.type)">
			<label class="mb-1 block text-sm text-gray-600">Height (px)</label>
			<UiInput
				type="number"
				:model-value="config.height || ''"
				placeholder="Auto"
				@update:model-value="$emit('update:config', { height: $event ? Number($event) : undefined })"
			/>
		</div>

		<!-- Divider style -->
		<div v-if="element.type === 'divider'">
			<label class="mb-1 block text-sm text-gray-600">Style</label>
			<UiSelect
				:model-value="config.style || 'solid'"
				:options="dividerStyles"
				@update:model-value="$emit('update:config', { style: $event })"
			/>
		</div>

		<!-- Divider color -->
		<div v-if="element.type === 'divider'">
			<label class="mb-1 block text-sm text-gray-600">Color</label>
			<input
				type="color"
				:value="config.color || '#e5e7eb'"
				class="h-8 w-full cursor-pointer rounded border border-gray-300"
				@input="$emit('update:config', { color: ($event.target as HTMLInputElement).value })"
			/>
		</div>

		<!-- Spacer height -->
		<div v-if="element.type === 'spacer'">
			<label class="mb-1 block text-sm text-gray-600">Height (px)</label>
			<UiInput
				type="number"
				:model-value="config.height || 24"
				@update:model-value="$emit('update:config', { height: Number($event) })"
			/>
		</div>

		<!-- Section settings -->
		<template v-if="element.type === 'section'">
			<div>
				<label class="mb-1 block text-sm text-gray-600">Title</label>
				<UiInput
					:model-value="config.title || ''"
					placeholder="Section title..."
					@update:model-value="$emit('update:config', { title: $event })"
				/>
			</div>

			<div>
				<label class="mb-1 block text-sm text-gray-600">Description</label>
				<UiTextarea
					:model-value="config.description || ''"
					:rows="2"
					placeholder="Optional description..."
					@update:model-value="$emit('update:config', { description: $event })"
				/>
			</div>

			<UiToggle
				:model-value="config.bordered || false"
				@update:model-value="$emit('update:config', { bordered: $event })"
			>
				Show border
			</UiToggle>

			<UiToggle
				:model-value="config.collapsible || false"
				@update:model-value="$emit('update:config', { collapsible: $event })"
			>
				Collapsible
			</UiToggle>

			<div v-if="config.collapsible">
				<UiToggle
					:model-value="config.defaultCollapsed || false"
					@update:model-value="$emit('update:config', { defaultCollapsed: $event })"
				>
					Collapsed by default
				</UiToggle>
			</div>

			<div>
				<label class="mb-1 block text-sm text-gray-600">Background Color</label>
				<input
					type="color"
					:value="config.backgroundColor || '#f9fafb'"
					class="h-8 w-full cursor-pointer rounded border border-gray-300"
					@input="$emit('update:config', { backgroundColor: ($event.target as HTMLInputElement).value })"
				/>
			</div>
		</template>
	</div>
</template>
