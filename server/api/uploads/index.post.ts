import { db } from "~~/server/db";
import { uploadsTable } from "~~/server/db/schema";
import { readMultipartFormData } from "h3";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { validateUpload, generateFilePaths } from "~~/server/utils/upload";

export default defineEventHandler(async (event) => {
	// 1. Parse multipart form data
	const formData = await readMultipartFormData(event);

	if (!formData || formData.length === 0) {
		throw createError({
			statusCode: 400,
			message: "No file uploaded",
		});
	}

	// Extract file from form data
	const fileField = formData.find((field) => field.name === "file");

	if (!fileField || !fileField.filename || !fileField.data) {
		throw createError({
			statusCode: 400,
			message: "Invalid file upload",
		});
	}

	// 2. Validate file
	const validation = validateUpload(fileField);
	if (!validation.valid) {
		throw createError({
			statusCode: 400,
			message: validation.error || "File validation failed",
		});
	}

	// 3. Generate safe filename and paths
	const { filename, storagePath, publicUrl, uploadDir } = generateFilePaths(
		fileField.filename,
		fileField.type || "application/octet-stream"
	);

	// 4. Ensure upload directory exists
	if (!existsSync(uploadDir)) {
		await mkdir(uploadDir, { recursive: true });
	}

	// 5. Write file to disk
	try {
		await writeFile(storagePath, fileField.data);
	} catch (error) {
		throw createError({
			statusCode: 500,
			message: "Failed to save file",
		});
	}

	// 6. Create database record
	const result = await db.insert(uploadsTable).values({
		filename,
		originalFilename: fileField.filename,
		mimeType: fileField.type || "application/octet-stream",
		fileSize: fileField.data.length,
		storagePath,
		publicUrl,
		uploadedBy: null, // Auth to be implemented later
	});

	const insertId = result[0].insertId;

	// 7. Fetch and return created record
	const upload = await db.query.uploadsTable.findFirst({
		where: (uploads, { eq }) => eq(uploads.id, insertId),
	});

	if (!upload) {
		throw createError({
			statusCode: 500,
			message: "Failed to retrieve upload record",
		});
	}

	return {
		success: true,
		upload: {
			id: upload.id,
			filename: upload.filename,
			originalFilename: upload.originalFilename,
			mimeType: upload.mimeType,
			fileSize: upload.fileSize,
			url: upload.publicUrl,
			uploadedAt: upload.uploadedAt,
		},
	};
});
