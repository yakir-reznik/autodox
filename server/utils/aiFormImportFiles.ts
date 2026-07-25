import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import type { AiImportFile } from "~~/server/utils/aiFormImport";

export type StoredAiImportFile = {
	filename: string;
	mimeType: string;
	storagePath: string;
};

export async function storeAiImportFile(file: AiImportFile): Promise<StoredAiImportFile> {
	const uploadDir = getAiImportUploadDir();
	const storagePath = join(uploadDir, `${randomUUID()}${extname(file.filename).toLowerCase()}`);

	await mkdir(uploadDir, { recursive: true });
	await writeFile(storagePath, file.data);

	return {
		filename: file.filename,
		mimeType: file.mimeType,
		storagePath,
	};
}

export async function readStoredAiImportFile(file: StoredAiImportFile): Promise<AiImportFile> {
	return {
		filename: file.filename,
		mimeType: file.mimeType,
		data: await readFile(file.storagePath),
	};
}

export async function deleteStoredAiImportFile(file: StoredAiImportFile | null) {
	if (!file) return;

	try {
		await unlink(file.storagePath);
	} catch (error) {
		if (isNotFoundError(error)) return;
		console.error("[AI Form Import] Failed to delete stored import file", error);
	}
}

function getAiImportUploadDir() {
	return process.env.AI_FORM_IMPORT_UPLOAD_DIR || join(process.cwd(), "storage", "ai-imports");
}

function isNotFoundError(error: unknown) {
	return typeof error === "object" &&
		error !== null &&
		"code" in error &&
		error.code === "ENOENT";
}
