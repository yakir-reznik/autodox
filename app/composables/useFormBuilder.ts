import type {
	BuilderElement,
	FormBuilderState,
	ElementType,
	ElementConfig,
	FormWithElements,
} from "~/types/form-builder";

function generateClientId(): string {
	return `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
		const newElement: BuilderElement = {
			id: null,
			clientId: generateClientId(),
			type,
			position: position ?? getNextPosition(parentId),
			parentId,
			name: null,
			config,
			isRequired: false,
		};

		state.elements.push(newElement);
		state.isDirty = true;
		state.selectedElementId = newElement.clientId;

		return newElement;
	}

	function removeElement(clientId: string) {
		// Also remove children if it's a section
		const element = state.elements.find((el) => el.clientId === clientId);
		if (element?.type === "section") {
			const children = getChildElements(clientId);
			for (const child of children) {
				removeElement(child.clientId);
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
	}

	function updateElement(clientId: string, updates: Partial<BuilderElement>) {
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
		const element = state.elements.find((el) => el.clientId === clientId);
		if (!element) return null;

		const siblings = element.parentId
			? getChildElements(element.parentId)
			: rootElements.value;
		const currentIndex = siblings.findIndex((el) => el.clientId === clientId);
		const afterElement = siblings[currentIndex];
		const nextElement = siblings[currentIndex + 1] || null;

		const newPosition = getPositionBetween(afterElement || null, nextElement);

		return addElement(
			element.type,
			JSON.parse(JSON.stringify(element.config)),
			element.parentId,
			newPosition
		);
	}

	// Reorder elements after drag-and-drop
	function reorderElements(
		newOrder: BuilderElement[],
		parentId: string | null = null
	) {
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
		const response = (await $fetch(`/api/forms/${id}`)) as FormWithElements;

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
			return {
				id: el.id,
				clientId,
				type: el.type,
				position: parseFloat(el.position),
				parentId: null, // Will be set in second pass
				name: el.name,
				config: el.config,
				isRequired: el.isRequired,
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
			const elementsPayload = state.elements.map((el) => ({
				id: el.id,
				tempId: el.id ? undefined : el.clientId,
				type: el.type,
				position: el.position.toFixed(5),
				parentId: el.parentId
					? clientIdToServerId.get(el.parentId) || el.parentId
					: null,
				name: el.name,
				config: el.config,
				isRequired: el.isRequired,
			}));

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
	};
}
