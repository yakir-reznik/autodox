<script setup lang="ts">
import type { BuilderElement, ElementType, ElementConfig } from "~/types/form-builder";
import { getDefaultConfig } from "~/composables/useElementDefaults";

interface Props {
	formId?: number;
}

const props = defineProps<Props>();

const {
	state,
	selectedElement,
	rootElements,
	getChildElements,
	addElement,
	removeElement,
	updateElement,
	selectElement,
	duplicateElement,
	reorderElements,
	loadForm,
	save,
} = useFormBuilder();

const { status, triggerSave, forceSave } = useAutoSave({
	debounceMs: 2000,
	onSave: save,
	onError: (error) => console.error("Auto-save failed:", error),
});

// Watch for title/description/status changes and mark as dirty
const initialTitle = ref<string>("");
const initialDescription = ref<string>("");
const initialStatus = ref<string>("");

watch(
	() => state.title,
	(newTitle) => {
		console.log("Title changed:", newTitle, "Initial:", initialTitle.value, "FormID:", state.formId);
		if (state.formId && newTitle !== initialTitle.value) {
			console.log("Setting isDirty to true");
			state.isDirty = true;
		}
	}
);

watch(
	() => state.description,
	(newDescription) => {
		console.log("Description changed:", newDescription, "Initial:", initialDescription.value);
		if (state.formId && newDescription !== initialDescription.value) {
			state.isDirty = true;
		}
	}
);

watch(
	() => state.status,
	(newStatus) => {
		console.log("Status changed:", newStatus, "Initial:", initialStatus.value);
		if (state.formId && newStatus !== initialStatus.value) {
			state.isDirty = true;
		}
	}
);

// Debug watcher for isDirty
watch(
	() => state.isDirty,
	(value) => {
		console.log("isDirty changed to:", value);
	}
);

// Watch for changes and trigger auto-save
watch(
	() => state.isDirty,
	(isDirty) => {
		if (isDirty) {
			triggerSave();
		}
	}
);

// Error state
const loadError = ref<string | null>(null);
const isLoading = ref(false);

// Load form on mount
onMounted(async () => {
	if (props.formId) {
		isLoading.value = true;
		try {
			await loadForm(props.formId);
			// Store initial values to track changes
			initialTitle.value = state.title;
			initialDescription.value = state.description;
			initialStatus.value = state.status;
		} catch (error) {
			console.error("Failed to load form:", error);
			loadError.value = error instanceof Error ? error.message : "Failed to load form";
		} finally {
			isLoading.value = false;
		}
	}
});

// Handle adding element from palette
function handleAddElement(type: ElementType) {
	const config = getDefaultConfig(type);
	addElement(type, config);
}

// Handle element drop from palette
function handleElementDrop(type: ElementType, position: number, parentId: string | null = null) {
	const config = getDefaultConfig(type);
	addElement(type, config, parentId, position);
}

// Handle element reorder in canvas
function handleReorder(elements: BuilderElement[], parentId: string | null = null) {
	reorderElements(elements, parentId);
}

// Handle property update
function handlePropertyUpdate(updates: Partial<BuilderElement>) {
	if (selectedElement.value) {
		updateElement(selectedElement.value.clientId, updates);
	}
}

// Deselect when clicking on empty canvas
function handleCanvasClick() {
	selectElement(null);
}
</script>

<template>
	<!-- Loading state -->
	<div v-if="isLoading" class="flex min-h-screen items-center justify-center bg-gray-100">
		<div class="text-center">
			<Icon name="svg-spinners:ring-resize" class="mx-auto h-8 w-8 text-blue-500" />
			<p class="mt-4 text-gray-600">Loading form...</p>
		</div>
	</div>

	<!-- Error state -->
	<div v-else-if="loadError" class="flex min-h-screen items-center justify-center bg-gray-100">
		<div class="max-w-md rounded-lg bg-white p-6 text-center shadow-lg">
			<Icon name="heroicons:exclamation-circle" class="mx-auto h-12 w-12 text-red-500" />
			<h2 class="mt-4 text-lg font-semibold text-gray-900">Failed to load form</h2>
			<p class="mt-2 text-sm text-gray-600">{{ loadError }}</p>
			<UiButton class="mt-4" @click="$router.push('/forms')">
				Back to forms
			</UiButton>
		</div>
	</div>

	<!-- Main builder -->
	<div v-else class="flex min-h-screen flex-col bg-gray-100">
		<!-- Header -->
		<FormBuilderFormHeader
			v-model:title="state.title"
			v-model:description="state.description"
			v-model:status="state.status"
			:save-status="status"
			:last-saved-at="state.lastSavedAt"
			:is-dirty="state.isDirty"
			@save="forceSave"
		/>

		<!-- Main content -->
		<div class="flex flex-1">
			<!-- Property Panel (Left in RTL) -->
			<aside
				v-if="selectedElement"
				class="w-80 shrink-0 overflow-y-auto border-e border-gray-200 bg-white"
			>
				<FormBuilderPropertyPanel
					:element="selectedElement"
					@update="handlePropertyUpdate"
					@close="selectElement(null)"
				/>
			</aside>

			<!-- Canvas (Center) -->
			<main class="flex-1 overflow-y-auto p-6" @click.self="handleCanvasClick">
				<FormBuilderFormCanvas
					:elements="rootElements"
					:selected-id="state.selectedElementId"
					:get-children="getChildElements"
					@select="selectElement"
					@delete="removeElement"
					@duplicate="duplicateElement"
					@reorder="handleReorder"
					@drop="handleElementDrop"
				/>
			</main>

			<!-- Element Palette (Right in RTL) -->
			<aside class="w-64 shrink-0 overflow-y-auto border-s border-gray-200 bg-white">
				<FormBuilderElementPalette @add="handleAddElement" />
			</aside>
		</div>
	</div>
</template>
