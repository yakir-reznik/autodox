import { requireFormPermission } from "~~/server/utils/authorization";
import {
	normalizeAndValidateUploadForm,
	replaceFormFromUploadJson,
	throwUploadJsonValidationError,
} from "~~/server/utils/formUploadJson";

export default defineEventHandler(async (event) => {
	const formId = Number(event.context.params?.id);

	if (isNaN(formId)) {
		throw createError({ statusCode: 400, message: "Invalid form ID" });
	}

	await requireFormPermission(event, formId, "edit_form");

	const body = await readBody(event);
	const validation = normalizeAndValidateUploadForm(body);

	if (!validation.body) {
		throwUploadJsonValidationError(validation.errors);
	}

	await replaceFormFromUploadJson(formId, validation.body);

	return {
		formId,
		success: true,
	};
});
