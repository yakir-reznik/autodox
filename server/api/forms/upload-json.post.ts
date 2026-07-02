import { requireRoles } from "~~/server/utils/authorization";
import {
	createFormFromUploadJson,
	normalizeAndValidateUploadForm,
	throwUploadJsonValidationError,
} from "~~/server/utils/formUploadJson";

export default defineEventHandler(async (event) => {
	const session = await requireRoles(event, ["user"]);
	const body = await readBody(event);
	const validation = normalizeAndValidateUploadForm(body, { requireTitle: true });

	if (!validation.body) {
		throwUploadJsonValidationError(validation.errors);
	}

	const formId = await createFormFromUploadJson(validation.body, session.user.id);

	return {
		formId,
		success: true,
	};
});
