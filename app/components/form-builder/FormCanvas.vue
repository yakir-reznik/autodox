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
	<div class="mx-auto max-w-3xl">
		<!-- Empty state -->
		<div
			v-if="elements.length === 0"
			class="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
		>
			<div class="text-center">
				<Icon name="heroicons:document-plus" class="mx-auto h-12 w-12 text-gray-400" />
				<p class="mt-2 text-sm text-gray-500">
					Drag elements here to build your form
				</p>
			</div>
		</div>

		<!-- Elements list -->
		<draggable
			v-else
			v-model="localElements"
			group="form-elements"
			item-key="clientId"
			handle=".drag-handle"
			ghost-class="opacity-50"
			animation="200"
			class="space-y-3"
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
	</div>
</template>
