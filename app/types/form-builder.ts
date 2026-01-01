import type {
	ElementType,
	ElementConfig,
	FormStatus,
	ValidationRules,
	SelectionOption,
} from "~~/server/db/schema";

// Re-export schema types for convenience
export type {
	ElementType,
	ElementConfig,
	FormStatus,
	ValidationRules,
	SelectionOption,
};

// Client-side element type (may not have real ID yet)
export interface BuilderElement {
	id: number | null; // null for new elements
	clientId: string; // Always present, used for local tracking
	type: ElementType;
	position: number; // Runtime uses number, converted to decimal for API
	parentId: string | null; // References clientId of parent
	name: string | null;
	config: ElementConfig;
	isRequired: boolean;
}

// Form builder state
export interface FormBuilderState {
	// Form metadata
	formId: number | null;
	title: string;
	description: string;
	status: FormStatus;

	// Elements
	elements: BuilderElement[];

	// UI state
	selectedElementId: string | null; // clientId of selected element
	isDirty: boolean;
	isSaving: boolean;
	lastSavedAt: Date | null;
	saveError: string | null;
}

// Element palette item (for the sidebar)
export interface PaletteElement {
	type: ElementType;
	label: string;
	icon: string;
	category: "input" | "selection" | "special" | "layout";
}

// Auto-save status
export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

// API types
export interface CreateFormRequest {
	title: string;
	description?: string;
	createdBy: number;
}

export interface UpdateFormRequest {
	title?: string;
	description?: string;
	status?: FormStatus;
	updatedBy?: number;
}

export interface SaveElementsRequest {
	elements: Array<{
		id?: number | null;
		tempId?: string;
		type: ElementType;
		position: string;
		parentId: number | string | null;
		name: string | null;
		config: ElementConfig;
		isRequired: boolean;
	}>;
}

export interface SaveElementsResponse {
	elements: Array<{
		id: number;
		clientId: string;
		type: ElementType;
		position: string;
		parentId: number | null;
		name: string | null;
		config: ElementConfig;
		isRequired: boolean;
	}>;
	mapping: Record<string, number>; // tempId -> real ID
}

// Form with elements (API response)
export interface FormWithElements {
	id: number;
	title: string;
	description: string | null;
	status: FormStatus;
	createdAt: string;
	updatedAt: string;
	createdBy: number;
	updatedBy: number | null;
	elements: Array<{
		id: number;
		type: ElementType;
		position: string;
		parentId: number | null;
		name: string | null;
		config: ElementConfig;
		isRequired: boolean;
		isDeleted: boolean;
		createdAt: string;
		updatedAt: string;
	}>;
}
