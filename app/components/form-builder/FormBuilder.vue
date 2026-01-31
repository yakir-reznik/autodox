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
		canUndo,
		canRedo,
		undo,
		redo,
	} = useFormBuilder();

	// Setup keyboard shortcuts for undo/redo
	useKeyboardShortcuts(undo, redo);

	const { status, triggerSave, forceSave } = useAutoSave({
		debounceMs: 10000,
		onSave: save,
		onError: (error) => console.error("Auto-save failed:", error),
	});

	// Watch for title/description/status/theme changes and mark as dirty
	const initialTitle = ref<string>("");
	const initialDescription = ref<string>("");
	const initialStatus = ref<string>("");
	const initialTheme = ref<string>("");

	watch(
		() => state.title,
		(newTitle) => {
			console.log(
				"Title changed:",
				newTitle,
				"Initial:",
				initialTitle.value,
				"FormID:",
				state.formId,
			);
			if (state.formId && newTitle !== initialTitle.value) {
				console.log("Setting isDirty to true");
				state.isDirty = true;
			}
		},
	);

	watch(
		() => state.description,
		(newDescription) => {
			console.log(
				"Description changed:",
				newDescription,
				"Initial:",
				initialDescription.value,
			);
			if (state.formId && newDescription !== initialDescription.value) {
				state.isDirty = true;
			}
		},
	);

	watch(
		() => state.status,
		(newStatus) => {
			console.log("Status changed:", newStatus, "Initial:", initialStatus.value);
			if (state.formId && newStatus !== initialStatus.value) {
				state.isDirty = true;
			}
		},
	);

	watch(
		() => state.theme,
		(newTheme) => {
			console.log("Theme changed:", newTheme, "Initial:", initialTheme.value);
			if (state.formId && newTheme !== initialTheme.value) {
				state.isDirty = true;
			}
		},
	);

	// Debug watcher for isDirty
	watch(
		() => state.isDirty,
		(value) => {
			console.log("isDirty changed to:", value);
		},
	);

	// Watch for changes and trigger auto-save
	watch(
		() => state.isDirty,
		(isDirty) => {
			if (isDirty) {
				triggerSave();
			}
		},
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
				initialTheme.value = state.theme;
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
	function handleElementDrop(
		type: ElementType,
		position: number,
		parentId: string | null = null,
	) {
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

	// Handle element update from canvas (e.g., drag-and-drop upload)
	function handleElementUpdate(clientId: string, updates: Partial<BuilderElement>) {
		updateElement(clientId, updates);
		// Select the element to show its properties in the panel
		selectElement(clientId);
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
			<BaseButton class="mt-4" @click="$router.push('/forms')"> Back to forms </BaseButton>
		</div>
	</div>

	<!-- Main builder -->
	<div v-else class="flex min-h-screen flex-col bg-gray-100">
		<!-- Header -->
		<FormBuilderFormHeader
			v-model:title="state.title"
			v-model:description="state.description"
			v-model:status="state.status"
			v-model:theme="state.theme"
			:save-status="status"
			:last-saved-at="state.lastSavedAt"
			:is-dirty="state.isDirty"
			:form-id="state.formId ?? undefined"
			:can-undo="canUndo"
			:can-redo="canRedo"
			@save="forceSave"
			@undo="undo"
			@redo="redo"
		/>

		<!-- Main content -->
		<div class="flex flex-1 overflow-hidden max-h-[calc(100vh-90px)]">
			<!-- Property Panel (Left in RTL) -->
			<aside class="w-80 shrink-0 overflow-y-auto border-e border-gray-200 bg-white">
				<FormBuilderPropertyPanel
					v-if="selectedElement"
					:element="selectedElement"
					@update="handlePropertyUpdate"
					@close="selectElement(null)"
				/>
				<div v-else class="flex h-full items-center justify-center p-6 text-center">
					<div class="text-gray-400">
						<Icon name="heroicons:cursor-arrow-rays" class="mx-auto h-12 w-12 mb-3" />
						<p class="text-sm font-medium">לא נבחר אלמנט</p>
						<p class="text-xs mt-2">
							לחץ על אלמנט בטופס<br />כדי לערוך את המאפיינים שלו
						</p>
					</div>
				</div>
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
					@update="handleElementUpdate"
				/>
			</main>

			<!-- Element Palette (Right in RTL) -->
			<aside class="w-64 shrink-0 overflow-y-auto border-s border-gray-200 bg-white">
				<FormBuilderElementPalette @add="handleAddElement" />
			</aside>
		</div>
	</div>
</template>
