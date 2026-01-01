<script setup lang="ts">
import draggable from "vuedraggable";
import type { ElementType, PaletteElement } from "~/types/form-builder";
import { useGroupedPaletteElements, getDefaultConfig } from "~/composables/useElementDefaults";

const emit = defineEmits<{
	add: [type: ElementType];
}>();

const groupedElements = useGroupedPaletteElements();

const categories = [
	{ key: "input", label: "Input Fields", elements: groupedElements.input },
	{ key: "selection", label: "Selection", elements: groupedElements.selection },
	{ key: "special", label: "Special", elements: groupedElements.special },
	{ key: "layout", label: "Layout", elements: groupedElements.layout },
];

// Clone function for drag-and-drop
function cloneElement(element: PaletteElement) {
	return {
		type: element.type,
		config: getDefaultConfig(element.type),
	};
}

// Handle click to add
function handleClick(type: ElementType) {
	emit("add", type);
}
</script>

<template>
	<div class="p-4">
		<h2 class="mb-4 text-lg font-semibold text-gray-900">Elements</h2>

		<div v-for="category in categories" :key="category.key" class="mb-6">
			<h3 class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
				{{ category.label }}
			</h3>

			<draggable
				:list="[...category.elements]"
				:group="{ name: 'form-elements', pull: 'clone', put: false }"
				:clone="cloneElement"
				item-key="type"
				:sort="false"
				class="space-y-2"
			>
				<template #item="{ element }">
					<div
						class="flex cursor-move items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-blue-400 hover:bg-blue-50"
						@click="handleClick(element.type)"
					>
						<Icon :name="element.icon" class="h-5 w-5 text-gray-500" />
						<span class="text-sm text-gray-700">{{ element.label }}</span>
					</div>
				</template>
			</draggable>
		</div>
	</div>
</template>
