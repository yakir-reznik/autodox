<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

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

		<!-- Media URL -->
		<div v-if="['image', 'video'].includes(element.type)">
			<label class="mb-1 block text-sm text-gray-600">URL</label>
			<UiInput
				:model-value="config.url || ''"
				placeholder="https://..."
				@update:model-value="$emit('update:config', { url: $event })"
			/>
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
