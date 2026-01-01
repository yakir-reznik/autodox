<script setup lang="ts">
import draggable from "vuedraggable";
import type { BuilderElement, ElementType } from "~/types/form-builder";
import { getElementComponent } from "~/composables/useElementDefaults";
import InputElement from "./InputElement.vue";
import TextareaElement from "./TextareaElement.vue";
import SelectionElement from "./SelectionElement.vue";
import SignatureElement from "./SignatureElement.vue";
import HeadingElement from "./HeadingElement.vue";
import ParagraphElement from "./ParagraphElement.vue";
import MediaElement from "./MediaElement.vue";
import DividerElement from "./DividerElement.vue";
import SpacerElement from "./SpacerElement.vue";
import SectionElement from "./SectionElement.vue";

interface Props {
	element: BuilderElement;
	selected: boolean;
	getChildren: (parentId: string) => BuilderElement[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
	select: [clientId?: string];
	delete: [clientId?: string];
	duplicate: [clientId?: string];
	reorder: [elements: BuilderElement[], parentId: string];
	drop: [type: ElementType, position: number, parentId: string];
}>();

// Get children for section elements
const children = computed(() => {
	if (props.element.type === "section") {
		return props.getChildren(props.element.clientId);
	}
	return [];
});

// Local copy for nested draggable
const localChildren = computed({
	get: () => [...children.value],
	set: (newElements) => {
		emit("reorder", newElements, props.element.clientId);
	},
});

// Handle nested drag
function handleNestedChange(event: any) {
	if (event.added) {
		const { element, newIndex } = event.added;
		// Only handle drops from palette (no clientId), not moves of existing elements
		if (element.type && element.config && !element.clientId) {
			const position = calculateNestedPosition(newIndex);
			emit("drop", element.type, position, props.element.clientId);
		}
	}
}

function calculateNestedPosition(index: number): number {
	const elements = children.value;
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

// Map element types to components
const componentMap = {
	InputElement,
	TextareaElement,
	SelectionElement,
	SignatureElement,
	HeadingElement,
	ParagraphElement,
	MediaElement,
	DividerElement,
	SpacerElement,
	SectionElement,
};

// Determine which component to render
const elementComponent = computed(() => {
	const componentName = getElementComponent(props.element.type);
	if (!componentName) {
		console.error(`No component mapping for element type: ${props.element.type}`);
		return null;
	}
	return componentMap[componentName as keyof typeof componentMap] || null;
});
</script>

<template>
	<div
		class="group relative rounded-lg border bg-white transition-all"
		:class="[
			selected
				? 'border-blue-500 ring-2 ring-blue-200'
				: 'border-gray-200 hover:border-gray-300',
		]"
		@click.stop="$emit('select', element.clientId)"
	>
		<!-- Drag handle and actions -->
		<div
			class="absolute -top-3 start-4 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
			:class="{ 'opacity-100': selected }"
		>
			<!-- Drag handle -->
			<div
				class="drag-handle flex cursor-move items-center rounded bg-gray-100 px-2 py-1 text-gray-500 hover:bg-gray-200"
			>
				<Icon name="heroicons:bars-3" class="h-4 w-4" />
			</div>

			<!-- Actions -->
			<button
				class="rounded bg-gray-100 p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
				title="Duplicate"
				@click.stop="$emit('duplicate', element.clientId)"
			>
				<Icon name="heroicons:document-duplicate" class="h-4 w-4" />
			</button>
			<button
				class="rounded bg-gray-100 p-1 text-gray-500 hover:bg-red-100 hover:text-red-600"
				title="Delete"
				@click.stop="$emit('delete', element.clientId)"
			>
				<Icon name="heroicons:trash" class="h-4 w-4" />
			</button>
		</div>

		<!-- Element content -->
		<div class="p-4">
			<component v-if="elementComponent" :is="elementComponent" :element="element" />
			<div v-else class="text-red-500">
				Failed to load component for element type: {{ element.type }}
			</div>

			<!-- Nested elements for sections -->
			<div v-if="element.type === 'section'" class="mt-4">
				<draggable
					v-model="localChildren"
					group="form-elements"
					item-key="clientId"
					handle=".drag-handle"
					ghost-class="opacity-50"
					animation="200"
					:class="children.length > 0 ? 'space-y-3' : 'min-h-[80px]'"
					@change="handleNestedChange"
				>
					<template #item="{ element: child }">
						<ElementWrapper
							:element="child"
							:selected="false"
							:get-children="getChildren"
							@select="(clientId) => $emit('select', clientId)"
							@delete="(clientId) => $emit('delete', clientId)"
							@duplicate="(clientId) => $emit('duplicate', clientId)"
							@reorder="(els, parentId) => $emit('reorder', els, parentId)"
							@drop="(type, pos, parentId) => $emit('drop', type, pos, parentId)"
						/>
					</template>

					<!-- Empty section state -->
					<template #footer>
						<div
							v-if="children.length === 0"
							class="flex min-h-[80px] items-center justify-center rounded border-2 border-dashed border-gray-200 bg-gray-50"
						>
							<p class="text-sm text-gray-400">Drag elements here</p>
						</div>
					</template>
				</draggable>
			</div>
		</div>
	</div>
</template>
