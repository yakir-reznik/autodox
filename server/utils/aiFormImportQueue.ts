import { randomUUID } from "node:crypto";
import PQueue from "p-queue";
import type {
	AiFormImportTaskCreateResponse,
	AiFormImportTaskStatus,
	AiFormImportTaskStatusResponse,
	AiFormImportValidationError,
} from "~~/shared/types/ai-form-import";
import {
	aiFormImportJsonSchema,
	aiFormImportPrompt,
	getAiFormImportProvider,
	type AiImportFile,
} from "~~/server/utils/aiFormImport";
import {
	createFormFromUploadJson,
	normalizeAndValidateUploadForm,
	replaceFormFromUploadJson,
} from "~~/server/utils/formUploadJson";

const AI_FORM_IMPORT_CONCURRENCY = Number.parseInt(process.env.AI_FORM_IMPORT_QUEUE_CONCURRENCY || "5", 10);
const AI_FORM_IMPORT_TASK_TIMEOUT_MS = 10 * 60 * 1000;
const AI_FORM_IMPORT_QUEUE_TIMEOUT_MS = AI_FORM_IMPORT_TASK_TIMEOUT_MS + 1000;
const AI_FORM_IMPORT_TASK_RETENTION_MS = 30 * 60 * 1000;

type AiFormImportTask = {
	id: string;
	userId: number;
	formId: number | null;
	file: AiImportFile | null;
	status: AiFormImportTaskStatus;
	createdAt: Date;
	updatedAt: Date;
	formResultId?: number;
	error?: string;
	provider?: string;
	providerStatus?: number;
	model?: string;
	usage?: unknown;
	invalidJson?: unknown;
	validationErrors?: AiFormImportValidationError[];
	timedOut: boolean;
	cleanupTimer?: ReturnType<typeof setTimeout>;
};

const aiFormImportQueue = new PQueue({
	concurrency: Number.isFinite(AI_FORM_IMPORT_CONCURRENCY) && AI_FORM_IMPORT_CONCURRENCY > 0
		? AI_FORM_IMPORT_CONCURRENCY
		: 5,
	timeout: AI_FORM_IMPORT_QUEUE_TIMEOUT_MS,
});

const tasks = new Map<string, AiFormImportTask>();

export function queueAiFormImportTask(payload: {
	userId: number;
	formId: number | null;
	file: AiImportFile;
}): AiFormImportTaskCreateResponse {
	const task: AiFormImportTask = {
		id: randomUUID(),
		userId: payload.userId,
		formId: payload.formId,
		file: payload.file,
		status: "queued",
		createdAt: new Date(),
		updatedAt: new Date(),
		timedOut: false,
	};

	tasks.set(task.id, task);

	aiFormImportQueue.add(
		() => runAiFormImportTask(task),
		{ id: task.id, timeout: AI_FORM_IMPORT_QUEUE_TIMEOUT_MS },
	).catch((error) => {
		if (isTerminalStatus(task.status)) return;
		markTaskFailed(task, error);
	});

	return {
		success: true,
		taskId: task.id,
		status: "queued",
	};
}

export function getAiFormImportTask(
	taskId: string,
	userId: number,
): AiFormImportTaskStatusResponse | null {
	const task = tasks.get(taskId);
	if (!task || task.userId !== userId) return null;

	return serializeTask(task);
}

async function runAiFormImportTask(task: AiFormImportTask) {
	const file = task.file;
	task.file = null;

	if (!file) {
		markTaskFailed(task, new Error("AI import file is missing"));
		return;
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => {
		task.timedOut = true;
		controller.abort(new Error("AI import task timed out"));
	}, AI_FORM_IMPORT_TASK_TIMEOUT_MS);
	unrefTimer(timeout);

	try {
		updateTaskStatus(task, "generating");
		const provider = await getAiFormImportProvider();
		throwIfTaskTimedOut(task);
		const initial = await provider.extractForm(file, aiFormImportPrompt, aiFormImportJsonSchema, controller.signal);
		throwIfTaskTimedOut(task);
		const initialValidation = normalizeAndValidateUploadForm(initial.json, { requireTitle: task.formId === null });

		let validBody = initialValidation.body;
		let usage = initial.usage;
		let model = initial.model;
		let invalidJson = initial.json;
		let validationErrors = initialValidation.errors;

		if (!validBody) {
			updateTaskStatus(task, "repairing");
			const repaired = await provider.repairFormJson(
				initial.json,
				initialValidation.errors,
				aiFormImportJsonSchema,
				controller.signal,
			);
			throwIfTaskTimedOut(task);
			const repairedValidation = normalizeAndValidateUploadForm(repaired.json, { requireTitle: task.formId === null });
			validBody = repairedValidation.body;
			usage = repaired.usage ?? usage;
			model = repaired.model ?? model;
			invalidJson = repaired.json;
			validationErrors = repairedValidation.errors;
		}

		if (!validBody) {
			throw createError({
				statusCode: 422,
				message: "AI output is invalid",
				data: {
					success: false,
					json: invalidJson,
					errors: validationErrors,
				},
			});
		}

		updateTaskStatus(task, "creating");
		throwIfTaskTimedOut(task);
		const resultFormId = task.formId ?? await createFormFromUploadJson(validBody, task.userId);
		if (task.formId !== null) {
			await replaceFormFromUploadJson(task.formId, validBody);
		}

		markTaskSucceeded(task, {
			formId: resultFormId,
			usage,
			model,
		});
	} catch (error) {
		markTaskFailed(task, error);
	} finally {
		clearTimeout(timeout);
		scheduleTaskCleanup(task);
	}
}

function markTaskSucceeded(
	task: AiFormImportTask,
	result: {
		formId: number;
		usage?: unknown;
		model?: string;
	},
) {
	task.status = "success";
	task.formResultId = result.formId;
	task.usage = result.usage;
	task.model = result.model;
	task.updatedAt = new Date();
}

function markTaskFailed(task: AiFormImportTask, error: unknown) {
	const data = getErrorData(error);

	task.status = task.timedOut || isAbortError(error) || isTimeoutError(error) ? "expired" : "failed";
	task.error = task.status === "expired"
		? "AI import task timed out"
		: getErrorMessage(error);
	task.provider = typeof data?.provider === "string" ? data.provider : undefined;
	task.providerStatus = typeof data?.providerStatus === "number" ? data.providerStatus : undefined;
	task.model = typeof data?.model === "string" ? data.model : task.model;
	task.invalidJson = data?.json;
	task.validationErrors = Array.isArray(data?.errors) ? data.errors : undefined;
	task.updatedAt = new Date();
	scheduleTaskCleanup(task);
}

function updateTaskStatus(task: AiFormImportTask, status: AiFormImportTaskStatus) {
	if (isTerminalStatus(task.status)) return;
	task.status = status;
	task.updatedAt = new Date();
}

function serializeTask(task: AiFormImportTask): AiFormImportTaskStatusResponse {
	return {
		taskId: task.id,
		status: task.status,
		...(task.formResultId ? { formId: task.formResultId } : {}),
		...(task.error ? { error: task.error } : {}),
		...(task.provider ? { provider: task.provider } : {}),
		...(task.providerStatus ? { providerStatus: task.providerStatus } : {}),
		...(task.model ? { model: task.model } : {}),
		...(task.usage ? { usage: task.usage } : {}),
		...(task.invalidJson ? { invalidJson: task.invalidJson } : {}),
		...(task.validationErrors ? { validationErrors: task.validationErrors } : {}),
		createdAt: task.createdAt.toISOString(),
		updatedAt: task.updatedAt.toISOString(),
	};
}

function scheduleTaskCleanup(task: AiFormImportTask) {
	if (!isTerminalStatus(task.status)) return;
	if (task.cleanupTimer) clearTimeout(task.cleanupTimer);

	task.cleanupTimer = setTimeout(() => {
		tasks.delete(task.id);
	}, AI_FORM_IMPORT_TASK_RETENTION_MS);
	unrefTimer(task.cleanupTimer);
}

function throwIfTaskTimedOut(task: AiFormImportTask) {
	if (!task.timedOut) return;
	throw new Error("AI import task timed out");
}

function isTerminalStatus(status: AiFormImportTaskStatus) {
	return status === "success" || status === "failed" || status === "expired";
}

function isTimeoutError(error: unknown) {
	if (!(error instanceof Error)) return false;
	return error.name === "TimeoutError" || /timed out|timeout/i.test(error.message);
}

function isAbortError(error: unknown) {
	return error instanceof Error && error.name === "AbortError";
}

function getErrorMessage(error: unknown) {
	if (error instanceof Error && error.message) return error.message;
	return "AI import task failed";
}

function getErrorData(error: unknown): Record<string, any> | undefined {
	if (typeof error !== "object" || error === null) return undefined;
	const data = (error as { data?: unknown }).data;
	return typeof data === "object" && data !== null ? data as Record<string, any> : undefined;
}

function unrefTimer(timer: ReturnType<typeof setTimeout>) {
	const maybeUnref = timer as { unref?: () => void };
	if (typeof maybeUnref.unref === "function") maybeUnref.unref();
}
