import { readMultipartFormData } from "h3";
import { requireFormPermission, requireRoles } from "~~/server/utils/authorization";
import {
	aiFormImportJsonSchema,
	aiFormImportPrompt,
	getAiFormImportSettings,
	getAiFormImportProvider,
	type AiImportFile,
} from "~~/server/utils/aiFormImport";
import {
	createFormFromUploadJson,
	normalizeAndValidateUploadForm,
	replaceFormFromUploadJson,
} from "~~/server/utils/formUploadJson";

const allowedMimeTypes = new Set([
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"image/jpeg",
	"image/png",
	"image/webp",
]);

export default defineEventHandler(async (event) => {
	const session = await requireRoles(event, ["admin"]);
	const settings = await getAiFormImportSettings();
	const formData = await readMultipartFormData(event);

	if (!formData?.length) {
		throw createError({ statusCode: 400, message: "File is required" });
	}

	const filePart = formData.find((part) => part.name === "file" && part.filename);
	const formIdPart = formData.find((part) => part.name === "formId");
	const formId = formIdPart?.data?.length ? Number(formIdPart.data.toString("utf8")) : null;

	if (formId !== null) {
		if (isNaN(formId)) {
			throw createError({ statusCode: 400, message: "Invalid form ID" });
		}
		await requireFormPermission(event, formId, "edit_form");
	}

	if (!filePart?.filename || !filePart.data?.length) {
		throw createError({ statusCode: 400, message: "File is required" });
	}

	if (filePart.data.length > settings.maxFileSizeBytes) {
		throw createError({ statusCode: 413, message: "File is too large" });
	}

	const mimeType = filePart.type || "";
	if (!allowedMimeTypes.has(mimeType)) {
		throw createError({ statusCode: 400, message: "Unsupported file type" });
	}

	const file: AiImportFile = {
		filename: filePart.filename,
		mimeType,
		data: filePart.data,
	};
	const provider = await getAiFormImportProvider();
	const initial = await provider.extractForm(file, aiFormImportPrompt, aiFormImportJsonSchema);
	const initialValidation = normalizeAndValidateUploadForm(initial.json, { requireTitle: formId === null });

	let validBody = initialValidation.body;
	let usage = initial.usage;
	let model = initial.model;
	let invalidJson = initial.json;
	let validationErrors = initialValidation.errors;

	if (!validBody) {
		const repaired = await provider.repairFormJson(initial.json, initialValidation.errors, aiFormImportJsonSchema);
		const repairedValidation = normalizeAndValidateUploadForm(repaired.json, { requireTitle: formId === null });
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

	const resultFormId = formId ?? await createFormFromUploadJson(validBody, session.user.id);
	if (formId !== null) {
		await replaceFormFromUploadJson(formId, validBody);
	}

	return {
		success: true,
		formId: resultFormId,
		...(usage ? { usage } : {}),
		...(model ? { model } : {}),
	};
});
