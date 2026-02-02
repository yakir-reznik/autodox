<script setup lang="ts">
	import draggable from "vuedraggable";
	import type { BuilderElement, ElementType } from "~/types/form-builder";

	interface Props {
		elements: BuilderElement[];
		selectedId: string | null;
		getChildren: (parentId: string) => BuilderElement[];
	}

	const props = defineProps<Props>();

	const emit = defineEmits<{
		select: [clientId: string];
		delete: [clientId: string];
		duplicate: [clientId: string];
		reorder: [elements: BuilderElement[], parentId: string | null];
		drop: [type: ElementType, position: number, parentId: string | null];
		update: [clientId: string, updates: Partial<BuilderElement>];
	}>();

	// Track dragging over drop zones
	const isDraggingOver = ref(false);

	// Local copy for draggable
	const localElements = computed({
		get: () => [...props.elements],
		set: (newElements) => {
			emit("reorder", newElements, null);
		},
	});

	// Handle drag end to calculate new positions
	function handleChange(event: any) {
		if (event.added) {
			// Element dropped from palette
			const { element, newIndex } = event.added;
			// Only handle drops from palette (no clientId), not moves of existing elements
			if (element.type && element.config && !element.clientId) {
				// This is a new element from palette
				const position = calculatePosition(newIndex);
				emit("drop", element.type, position, null);
			}
		}
	}

	function calculatePosition(index: number): number {
		const elements = props.elements;
		if (elements.length === 0) return 1000;
		if (index === 0) {
			return elements[0] ? elements[0].position / 2 : 1000;
		}
		if (index >= elements.length) {
			return (elements[elements.length - 1]?.position || 0) + 1000;
		}
		const before = elements[index - 1];
		const after = elements[index];
		if (!before || !after) return 1000;
		return (before.position + after.position) / 2;
	}
</script>

<template>
	<div
		class="mx-auto relative max-w-3xl rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4"
		:class="{ 'pb-40': elements.length > 0 }"
		@dragenter="isDraggingOver = true"
		@dragleave="isDraggingOver = false"
	>
		<draggable
			v-model="localElements"
			group="form-elements"
			item-key="clientId"
			handle=".drag-handle"
			animation="200"
			class="min-h-[400px]"
			:class="{
				'flex items-center justify-center': elements.length === 0,
				'space-y-3': elements.length > 0,
			}"
			@change="handleChange"
		>
			<template #item="{ element }">
				<FormBuilderElementsElementWrapper
					:element="element"
					:selected="element.clientId === selectedId"
					:get-children="getChildren"
					@select="(clientId) => $emit('select', clientId || element.clientId)"
					@delete="(clientId) => $emit('delete', clientId || element.clientId)"
					@duplicate="(clientId) => $emit('duplicate', clientId || element.clientId)"
					@reorder="(els, parentId) => $emit('reorder', els, parentId)"
					@drop="(type, pos, parentId) => $emit('drop', type, pos, parentId)"
					@update="(clientId, updates) => $emit('update', clientId, updates)"
				/>
			</template>
		</draggable>

		<!-- Drop zone indicator when there are elements -->
		<div
			v-if="elements.length > 0"
			class="flex mt-4 flex-col items-center justify-center py-8 border-2 border-dashed border-gray-300 rounded-lg transition-opacity absolute left-4 bottom-4 w-[calc(100%-2rem)]"
			:class="{ 'opacity-50': isDraggingOver }"
		>
			<Icon name="heroicons:arrow-up" class="h-6 w-6 text-gray-400" />
			<p class="mt-2 text-sm text-gray-500">גרור אלמנטים חדשים לכאן</p>
		</div>

		<!-- Empty state message -->
		<div
			v-if="elements.length === 0"
			class="flex items-center justify-center absolute inset-0 transition-opacity"
			:class="{ 'opacity-50': isDraggingOver }"
		>
			<div class="text-center">
				<Icon name="heroicons:document-plus" class="mx-auto h-12 w-12 text-gray-400" />
				<p class="mt-2 text-sm text-gray-500">גרור אלמנטים לפה בכדי לבנות את הטופס</p>
			</div>
		</div>
	</div>
</template>
