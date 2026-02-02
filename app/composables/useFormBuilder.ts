import type {
	BuilderElement,
	FormBuilderState,
	ElementType,
	ElementConfig,
	FormWithElements,
	HistoryEntry,
	ConditionGroup,
} from "~/types/form-builder";
import { isFieldElement } from "./useElementDefaults";
import { useHistory } from "./useHistory";

function generateClientId(): string {
	return `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateUniqueName(
	type: ElementType,
	existingElements: BuilderElement[]
): string {
	// Get base name from type (remove underscores for cleaner names)
	const baseName = type.replace(/_/g, "");

	// Find all existing names with this base
	const existingNames = existingElements
		.map((el) => el.name)
		.filter((name): name is string => name !== null);

	// Find the highest number suffix for this base name
	let maxNumber = 0;
	const pattern = new RegExp(`^${baseName}(\\d+)$`);

	for (const name of existingNames) {
		const match = name.match(pattern);
		if (match && match[1]) {
			const num = parseInt(match[1], 10);
			if (num > maxNumber) {
				maxNumber = num;
			}
		}
	}

	// Return the next available number
	return `${baseName}${maxNumber + 1}`;
}

export function useFormBuilder() {
	const state = reactive<FormBuilderState>({
		formId: null,
		title: "",
		description: "",
		status: "draft",
		theme: "default",
		elements: [],
		selectedElementId: null,
		isDirty: false,
		isSaving: false,
		lastSavedAt: null,
		saveError: null,
	});

	// History management for undo/redo (only structural changes: add/remove/move/reorder/duplicate)
	const history = useHistory();
	const isUndoRedoOperation = ref(false);

	function getSnapshot(): HistoryEntry {
		return {
			elements: JSON.parse(JSON.stringify(state.elements)) as BuilderElement[],
			selectedElementId: state.selectedElementId,
		};
	}

	function recordHistory() {
		if (isUndoRedoOperation.value) return;
		history.record(getSnapshot());
	}

	// Computed properties
	const selectedElement = computed(() =>
		state.elements.find((el) => el.clientId === state.selectedElementId)
	);

	const rootElements = computed(() =>
		state.elements
			.filter((el) => el.parentId === null)
			.sort((a, b) => a.position - b.position)
	);

	function getChildElements(parentClientId: string): BuilderElement[] {
		return state.elements
			.filter((el) => el.parentId === parentClientId)
			.sort((a, b) => a.position - b.position);
	}

	// Calculate next position for adding elements
	function getNextPosition(parentId: string | null = null): number {
		const siblings = parentId
			? getChildElements(parentId)
			: rootElements.value;
		if (siblings.length === 0) return 1000;
		return Math.max(...siblings.map((el) => el.position)) + 1000;
	}

	// Calculate position between two elements
	function getPositionBetween(
		before: BuilderElement | null,
		after: BuilderElement | null
	): number {
		if (!before && !after) return 1000;
		if (!before) return after!.position / 2;
		if (!after) return before.position + 1000;
		return (before.position + after.position) / 2;
	}

	// Actions
	function addElement(
		type: ElementType,
		config: ElementConfig,
		parentId: string | null = null,
		position?: number
	): BuilderElement {
		recordHistory();

		// Generate unique name for field elements
		const elementName = isFieldElement(type)
			? generateUniqueName(type, state.elements)
			: null;

		const newElement: BuilderElement = {
			id: null,
			clientId: generateClientId(),
			type,
			position: position ?? getNextPosition(parentId),
			parentId,
			name: elementName,
			config,
			isRequired: false,
		};

		state.elements.push(newElement);
		state.isDirty = true;
		state.selectedElementId = newElement.clientId;

		return newElement;
	}

	function removeElement(clientId: string, isRecursiveCall = false) {
		// Record history only for the top-level call, not recursive children removals
		if (!isRecursiveCall) {
			recordHistory();
		}

		// Also remove children if it's a section
		const element = state.elements.find((el) => el.clientId === clientId);
		if (element?.type === "section") {
			const children = getChildElements(clientId);
			for (const child of children) {
				removeElement(child.clientId, true);
			}
		}

		const index = state.elements.findIndex((el) => el.clientId === clientId);
		if (index !== -1) {
			state.elements.splice(index, 1);
			state.isDirty = true;

			if (state.selectedElementId === clientId) {
				state.selectedElementId = null;
			}
		}

		// Top-level call: remove condition rules that reference any deleted elements
		if (!isRecursiveCall) {
			const existingIds = new Set(state.elements.map((el) => el.clientId));
			for (const el of state.elements) {
				if (!el.conditions?.rules.length) continue;
				el.conditions.rules = el.conditions.rules.filter((rule) =>
					existingIds.has(rule.sourceFieldId)
				);
				if (el.conditions.rules.length === 0) {
					el.conditions.enabled = false;
				}
			}
		}
	}

	function updateElement(clientId: string, updates: Partial<BuilderElement>) {
		// Note: Property updates are not recorded in history (only structural changes like add/remove/reorder)
		const element = state.elements.find((el) => el.clientId === clientId);
		if (element) {
			Object.assign(element, updates);
			state.isDirty = true;
		}
	}

	function moveElement(
		clientId: string,
		newPosition: number,
		newParentId: string | null = null
	) {
		recordHistory();

		const element = state.elements.find((el) => el.clientId === clientId);
		if (element) {
			element.position = newPosition;
			element.parentId = newParentId;
			state.isDirty = true;
		}
	}

	function selectElement(clientId: string | null) {
		state.selectedElementId = clientId;
	}

	function duplicateElement(clientId: string): BuilderElement | null {
		recordHistory();

		const element = state.elements.find((el) => el.clientId === clientId);
		if (!element) return null;

		const siblings = element.parentId
			? getChildElements(element.parentId)
			: rootElements.value;
		const currentIndex = siblings.findIndex((el) => el.clientId === clientId);
		const afterElement = siblings[currentIndex];
		const nextElement = siblings[currentIndex + 1] || null;

		const newPosition = getPositionBetween(afterElement || null, nextElement);

		// Use internal add to avoid double recording
		const elementName = isFieldElement(element.type)
			? generateUniqueName(element.type, state.elements)
			: null;

		const newElement: BuilderElement = {
			id: null,
			clientId: generateClientId(),
			type: element.type,
			position: newPosition,
			parentId: element.parentId,
			name: elementName,
			config: JSON.parse(JSON.stringify(element.config)),
			isRequired: false,
			conditions: element.conditions
				? JSON.parse(JSON.stringify(element.conditions))
				: null,
		};

		state.elements.push(newElement);
		state.isDirty = true;
		state.selectedElementId = newElement.clientId;

		return newElement;
	}

	// Reorder elements after drag-and-drop
	function reorderElements(
		newOrder: BuilderElement[],
		parentId: string | null = null
	) {
		recordHistory();

		// Update positions based on new order
		newOrder.forEach((element, index) => {
			const el = state.elements.find((e) => e.clientId === element.clientId);
			if (el) {
				el.position = (index + 1) * 1000;
				el.parentId = parentId;
			}
		});
		state.isDirty = true;
	}

	// API operations
	async function createForm(): Promise<number> {
		const response = await $fetch("/api/forms", {
			method: "POST",
			body: {
				title: state.title || "Untitled Form",
				description: state.description,
				createdBy: 1, // TODO: Get from auth
			},
		});

		state.formId = (response as { id: number }).id;
		return state.formId;
	}

	async function loadForm(id: number) {
		const response = await $fetch<FormWithElements>(`/api/forms/${id}`);

		state.formId = response.id;
		state.title = response.title;
		state.description = response.description || "";
		state.status = response.status;
		state.theme = response.theme;

		// Convert server elements to builder elements
		const serverIdToClientId = new Map<number, string>();

		state.elements = response.elements.map((el) => {
			const clientId = generateClientId();
			serverIdToClientId.set(el.id, clientId);

			const { _conditions, ...config } = el.config as ElementConfig & {
				_conditions?: ConditionGroup;
			};

			return {
				id: el.id,
				clientId,
				type: el.type,
				position: parseFloat(el.position),
				parentId: null, // Will be set in second pass
				name: el.name,
				config,
				isRequired: el.isRequired,
				conditions: _conditions ?? null,
			};
		});

		// Second pass: Set parent references using clientIds
		for (const serverEl of response.elements) {
			if (serverEl.parentId) {
				const clientId = serverIdToClientId.get(serverEl.id);
				const parentClientId = serverIdToClientId.get(serverEl.parentId);
				if (clientId && parentClientId) {
					const el = state.elements.find((e) => e.clientId === clientId);
					if (el) {
						el.parentId = parentClientId;
					}
				}
			}
		}

		// Third pass: Map condition sourceFieldIds from serverId to clientId
		for (const el of state.elements) {
			if (!el.conditions?.rules.length) continue;
			for (const rule of el.conditions.rules) {
				rule.sourceFieldId =
					serverIdToClientId.get(Number(rule.sourceFieldId)) ?? rule.sourceFieldId;
			}
		}

		state.isDirty = false;
		state.lastSavedAt = new Date();
	}

	async function save(): Promise<void> {
		if (!state.isDirty && state.formId) return;

		state.isSaving = true;
		state.saveError = null;

		try {
			// Create form if it doesn't exist
			if (!state.formId) {
				await createForm();
			}

			// Update form metadata
			await $fetch(`/api/forms/${state.formId}`, {
				method: "PATCH",
				body: {
					title: state.title,
					description: state.description,
					status: state.status,
					theme: state.theme,
					updatedBy: 1, // TODO: Get from auth
				},
			});

			// Build clientId to serverId mapping for existing elements
			const clientIdToServerId = new Map<string, number>();
			for (const el of state.elements) {
				if (el.id) {
					clientIdToServerId.set(el.clientId, el.id);
				}
			}

			// Prepare elements for API
			const elementsPayload = state.elements.map((el) => {
				const config = { ...el.config };

				// Embed conditions into config, mapping clientIds to serverIds
				if (el.conditions?.enabled && el.conditions.rules.length > 0) {
					(config as Record<string, unknown>)._conditions = {
						...el.conditions,
						rules: el.conditions.rules.map((rule) => ({
							...rule,
							sourceFieldId: String(
								clientIdToServerId.get(rule.sourceFieldId) ?? rule.sourceFieldId
							),
						})),
					};
				}

				return {
					id: el.id,
					tempId: el.id ? undefined : el.clientId,
					type: el.type,
					position: el.position.toFixed(5),
					parentId: el.parentId
						? clientIdToServerId.get(el.parentId) || el.parentId
						: null,
					name: el.name,
					config,
					isRequired: el.isRequired,
				};
			});

			// Save elements
			const response = await $fetch(`/api/forms/${state.formId}/elements`, {
				method: "PUT",
				body: { elements: elementsPayload },
			});

			// Update local elements with real IDs
			const { mapping } = response as { mapping: Record<string, number> };
			for (const [tempId, realId] of Object.entries(mapping)) {
				const el = state.elements.find((e) => e.clientId === tempId);
				if (el) {
					el.id = realId;
				}
			}

			state.isDirty = false;
			state.lastSavedAt = new Date();
		} catch (error) {
			state.saveError =
				error instanceof Error ? error.message : "Failed to save";
			throw error;
		} finally {
			state.isSaving = false;
		}
	}

	// Undo/Redo operations
	function performUndo() {
		const snapshot = history.undo(getSnapshot());
		if (!snapshot) return;

		isUndoRedoOperation.value = true;
		state.elements = snapshot.elements;
		state.selectedElementId = snapshot.selectedElementId;
		state.isDirty = true;
		isUndoRedoOperation.value = false;
	}

	function performRedo() {
		const snapshot = history.redo(getSnapshot());
		if (!snapshot) return;

		isUndoRedoOperation.value = true;
		state.elements = snapshot.elements;
		state.selectedElementId = snapshot.selectedElementId;
		state.isDirty = true;
		isUndoRedoOperation.value = false;
	}

	// Reset state
	function reset() {
		state.formId = null;
		state.title = "";
		state.description = "";
		state.status = "draft";
		state.theme = "default";
		state.elements = [];
		state.selectedElementId = null;
		state.isDirty = false;
		state.isSaving = false;
		state.lastSavedAt = null;
		state.saveError = null;
		history.clear();
	}

	return {
		state,
		selectedElement,
		rootElements,
		getChildElements,
		getNextPosition,
		getPositionBetween,
		addElement,
		removeElement,
		updateElement,
		moveElement,
		selectElement,
		duplicateElement,
		reorderElements,
		createForm,
		loadForm,
		save,
		reset,
		// History
		canUndo: history.canUndo,
		canRedo: history.canRedo,
		undo: performUndo,
		redo: performRedo,
	};
}
