<script setup lang="ts">
	import draggable from "vuedraggable";
	import type { BuilderElement, ElementType, GridBreakpointConfig } from "~/types/form-builder";
	import { canAccept, getElementComponent } from "~/composables/useElementDefaults";
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
	import RepeaterElement from "./RepeaterElement.vue";
	import GridElement from "./GridElement.vue";

	interface Props {
		element: BuilderElement;
		selected: boolean;
		selectedId: string | null;
		getChildren: (parentId: string) => BuilderElement[];
		parentIsGrid?: boolean;
		gridIndex?: number;
		gridSiblingCount?: number;
	}

	const props = withDefaults(defineProps<Props>(), {
		parentIsGrid: false,
		gridIndex: 0,
		gridSiblingCount: 0,
	});

	const emit = defineEmits<{
		select: [clientId?: string];
		delete: [clientId?: string];
		duplicate: [clientId?: string];
		reorder: [elements: BuilderElement[], parentId: string];
		drop: [type: ElementType, position: number, parentId: string];
		update: [clientId: string, updates: Partial<BuilderElement>];
		editConditions: [clientId: string];
		move: [direction: -1 | 1];
	}>();

	// Handle config updates from child elements (e.g., drag-and-drop upload in MediaElement)
	function handleConfigUpdate(configUpdates: Record<string, any>) {
		emit("update", props.element.clientId, {
			config: { ...props.element.config, ...configUpdates },
		});
	}

	// Shared drag state — used to expand container drop zones during a drag
	const { isDragging } = useFormBuilderDragState();

	// Check if element is a container type (can have nested children)
	const isContainer = computed(
		() =>
			props.element.type === "section" ||
			props.element.type === "repeater" ||
			props.element.type === "grid",
	);

	const isGrid = computed(() => props.element.type === "grid");

	// Desktop layout for the builder canvas (mobile values apply only in fill mode)
	const gridStyle = computed(() => {
		if (!isGrid.value) return undefined;
		const cfg = props.element.config as { desktop?: GridBreakpointConfig };
		const d = cfg.desktop;
		if (!d) return undefined;
		return {
			display: "grid",
			gridTemplateColumns: `repeat(${d.columns}, minmax(0, 1fr))`,
			gap: d.gap,
			justifyItems: d.justify,
			alignItems: d.align,
		};
	});

	// Get children for container elements (section, repeater)
	const children = computed(() => {
		if (isContainer.value) {
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

	// Reject drops that violate containment rules (e.g. containers into a grid)
	function handleMove(event: any): boolean {
		const dragged = event.draggedContext?.element;
		const childType: ElementType | undefined = dragged?.type;
		if (!childType) return true;
		return canAccept(props.element.type, childType);
	}

	// Manual reorder for grid children (drag in flex-wrap is unreliable)
	function moveChild(index: number, direction: -1 | 1) {
		const arr = [...children.value];
		const newIndex = index + direction;
		if (newIndex < 0 || newIndex >= arr.length) return;
		const a = arr[index];
		const b = arr[newIndex];
		if (!a || !b) return;
		arr[index] = b;
		arr[newIndex] = a;
		emit("reorder", arr, props.element.clientId);
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
		RepeaterElement,
		GridElement,
	};

	// Get container background color for styling (section, repeater)
	const containerBackgroundColor = computed(() => {
		if (isContainer.value) {
			const config = props.element.config as { backgroundColor?: string };
			return config.backgroundColor || undefined;
		}
		return undefined;
	});

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
		class="group relative rounded-lg border transition-all select-none"
		:class="[
			!isContainer && 'bg-white',
			selected
				? 'border-blue-500 ring-2 ring-blue-200'
				: 'border-gray-200 hover:border-gray-300',
		]"
		:style="isContainer ? { backgroundColor: containerBackgroundColor } : {}"
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

		<!-- Grid reorder buttons (top-left, drag in 2D grid is unreliable) -->
		<div
			v-if="parentIsGrid"
			class="absolute -top-3 end-4 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
			:class="{ 'opacity-100': selected }"
		>
			<button
				class="rounded bg-gray-100 p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-gray-100 disabled:hover:text-gray-500"
				title="הזז אחורה"
				:disabled="gridIndex === 0"
				@click.stop="$emit('move', -1)"
			>
				<Icon name="heroicons:chevron-right" class="h-4 w-4" />
			</button>
			<button
				class="rounded bg-gray-100 p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-gray-100 disabled:hover:text-gray-500"
				title="הזז קדימה"
				:disabled="gridIndex >= gridSiblingCount - 1"
				@click.stop="$emit('move', 1)"
			>
				<Icon name="heroicons:chevron-left" class="h-4 w-4" />
			</button>
		</div>

		<!-- Condition indicator (always visible) -->
		<div
			v-if="element.conditions?.enabled && element.conditions.rules.length > 0"
			class="absolute -top-2.5 end-4 rounded bg-amber-100 p-1 text-amber-600 cursor-pointer hover:bg-amber-200"
			title="לוגיקה מותנית"
			@click.stop="$emit('editConditions', element.clientId)"
		>
			<button class="flex items-center gap-2 px-2">
				<span>עריכת לוגיקה</span>
				<Icon name="heroicons:bolt" class="h-3.5 w-3.5" />
			</button>
		</div>

		<!-- Element content -->
		<div class="p-4">
			<component
				v-if="elementComponent"
				:is="elementComponent"
				:element="element"
				@update:config="handleConfigUpdate"
			/>
			<div v-else class="text-red-500">
				Failed to load component for element type: {{ element.type }}
			</div>

			<!-- Nested elements for containers (section, repeater) -->
			<div v-if="isContainer" class="mt-4">
				<draggable
					v-model="localChildren"
					group="form-elements"
					item-key="clientId"
					handle=".drag-handle"
					:animation="200"
					:move="handleMove"
					:class="[
						!isGrid && (children.length > 0 ? 'space-y-3' : 'min-h-20'),
						isDragging && 'rounded-lg bg-blue-50/40 transition-all',
					]"
					:style="gridStyle"
					@change="handleNestedChange"
					@start="isDragging = true"
					@end="isDragging = false"
				>
					<template #header>
						<div
							v-if="isDragging && children.length > 0"
							class="mb-3 flex items-center justify-center rounded border-2 border-dashed border-blue-200 bg-white/60 py-2 text-xs font-medium text-blue-300 pointer-events-none"
							:style="isGrid ? { gridColumn: '1 / -1' } : undefined"
						>
							<Icon name="heroicons:arrow-down-tray" class="me-1 h-4 w-4" />
							שחרר כאן כדי להוסיף לתחילת
							{{ element.type === "repeater" ? "שדה החזרה" : "המקטע" }}
						</div>
					</template>

					<template #item="{ element: child, index }">
						<ElementWrapper
							:element="child"
							:selected="child.clientId === selectedId"
							:selected-id="selectedId"
							:get-children="getChildren"
							:parent-is-grid="isGrid"
							:grid-index="index"
							:grid-sibling-count="children.length"
							@select="(clientId) => $emit('select', clientId)"
							@delete="(clientId) => $emit('delete', clientId)"
							@duplicate="(clientId) => $emit('duplicate', clientId)"
							@reorder="(els, parentId) => $emit('reorder', els, parentId)"
							@drop="(type, pos, parentId) => $emit('drop', type, pos, parentId)"
							@update="(clientId, updates) => $emit('update', clientId, updates)"
							@edit-conditions="(clientId) => $emit('editConditions', clientId)"
							@move="(direction) => moveChild(index, direction)"
						/>
					</template>

					<!-- Drop-zone footer: empty state + drop-at-end ghost while dragging -->
					<template #footer>
						<div
							v-if="children.length === 0"
							class="flex min-h-20 items-center justify-center rounded border-2 border-dashed bg-gray-50"
							:class="isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200'"
							:style="isGrid ? { gridColumn: '1 / -1' } : undefined"
						>
							<p
								class="text-sm"
								:class="isDragging ? 'text-blue-600 font-medium' : 'text-gray-400'"
							>
								{{
									isDragging ? "שחרר כאן כדי להוסיף למקטע" : "הוספ/י אלמנטים לכאן"
								}}
							</p>
						</div>
						<div
							v-else-if="isDragging"
							class="mt-3 flex items-center justify-center rounded border-2 border-dashed border-blue-200 bg-white/60 py-2 text-xs font-medium text-blue-300 pointer-events-none"
							:style="isGrid ? { gridColumn: '1 / -1' } : undefined"
						>
							<Icon name="heroicons:arrow-up-tray" class="me-1 h-4 w-4" />
							שחרר כאן כדי להוסיף לסוף
							{{ element.type === "repeater" ? "שדה החזרה" : "המקטע" }}
						</div>
					</template>
				</draggable>
			</div>
		</div>
	</div>
</template>
