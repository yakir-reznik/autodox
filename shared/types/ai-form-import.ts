export type AiFormImportTaskStatus =
	| "queued"
	| "generating"
	| "repairing"
	| "creating"
	| "success"
	| "failed"
	| "expired";

export type AiFormImportValidationError = {
	path: string;
	message: string;
};

export type AiFormImportTaskCreateResponse = {
	success: true;
	taskId: string;
	status: "queued";
};

export type AiFormImportTaskStatusResponse = {
	taskId: string;
	status: AiFormImportTaskStatus;
	formId?: number;
	error?: string;
	provider?: string;
	providerStatus?: number;
	model?: string;
	usage?: unknown;
	invalidJson?: unknown;
	validationErrors?: AiFormImportValidationError[];
	createdAt: string;
	updatedAt: string;
};
