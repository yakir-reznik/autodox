import { readMultipartFormData } from "h3";
import { requireFormPermission, requireRoles } from "~~/server/utils/authorization";
import { getAiFormImportSettings, type AiImportFile } from "~~/server/utils/aiFormImport";
import { deleteStoredAiImportFile, storeAiImportFile } from "~~/server/utils/aiFormImportFiles";
import { queueAiFormImportTask } from "~~/server/utils/aiFormImportQueue";

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
	const storedFile = await storeAiImportFile(file);

	try {
		return queueAiFormImportTask({
			userId: session.user.id,
			formId,
			file: storedFile,
		});
	} catch (error) {
		await deleteStoredAiImportFile(storedFile);
		throw error;
	}
});
