import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { join, resolve, extname } from "path";

const MIME_TYPES: Record<string, string> = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
	".gif": "image/gif",
};

export default defineEventHandler(async (event) => {
	const requestedPath = getRouterParam(event, "path") || "";

	const baseDir = resolve(
		process.env.UPLOAD_DIR || join(process.cwd(), "storage", "uploads")
	);
	const absolutePath = resolve(join(baseDir, requestedPath));

	// Prevent path traversal — resolved path must stay under baseDir
	if (!absolutePath.startsWith(baseDir + "/") && absolutePath !== baseDir) {
		throw createError({ statusCode: 403, message: "Forbidden" });
	}

	let stats;
	try {
		stats = await stat(absolutePath);
	} catch {
		throw createError({ statusCode: 404, message: "Not found" });
	}

	if (!stats.isFile()) {
		throw createError({ statusCode: 404, message: "Not found" });
	}

	const mime = MIME_TYPES[extname(absolutePath).toLowerCase()] || "application/octet-stream";
	setHeader(event, "Content-Type", mime);
	setHeader(event, "Content-Length", stats.size);
	setHeader(event, "Cache-Control", "public, max-age=31536000, immutable");

	return sendStream(event, createReadStream(absolutePath));
});
