import { createHash, randomBytes } from "crypto";
import { extname } from "path";
import { join } from "path";

// Constants
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
const ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
];

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

// MIME type to extension mapping (for validation)
const MIME_TO_EXT: Record<string, string[]> = {
	"image/jpeg": [".jpg", ".jpeg"],
	"image/png": [".png"],
	"image/webp": [".webp"],
	"image/gif": [".gif"],
};

interface ValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * Validates uploaded file for size, MIME type, and extension
 */
export function validateUpload(file: {
	filename?: string;
	type?: string;
	data: Buffer;
}): ValidationResult {
	// Check file size
	if (file.data.length > MAX_FILE_SIZE) {
		return {
			valid: false,
			error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
		};
	}

	// Check MIME type
	const mimeType = file.type || "application/octet-stream";
	if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
		return {
			valid: false,
			error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
		};
	}

	// Check file extension
	const ext = extname(file.filename || "").toLowerCase();
	if (!ALLOWED_EXTENSIONS.includes(ext)) {
		return {
			valid: false,
			error: `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(", ")}`,
		};
	}

	// Verify MIME type matches extension (security check)
	const allowedExtsForMime = MIME_TO_EXT[mimeType];
	if (!allowedExtsForMime || !allowedExtsForMime.includes(ext)) {
		return {
			valid: false,
			error: "File extension does not match file type",
		};
	}

	return { valid: true };
}

/**
 * Generates safe filename and storage paths
 * Uses hash + timestamp + random bytes to prevent collisions
 */
export function generateFilePaths(
	originalFilename: string,
	mimeType: string
): {
	filename: string;
	storagePath: string;
	publicUrl: string;
	uploadDir: string;
} {
	// Extract extension
	const ext = extname(originalFilename).toLowerCase();

	// Generate unique filename: hash(timestamp + random) + extension
	const timestamp = Date.now().toString();
	const random = randomBytes(8).toString("hex");
	const hash = createHash("sha256")
		.update(`${timestamp}-${random}`)
		.digest("hex")
		.substring(0, 32); // 32 chars

	const filename = `${hash}${ext}`;

	// Organize by year/month for better file management
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");

	// Paths
	const relativePath = `uploads/${year}/${month}/${filename}`;
	const uploadDir = join(
		process.cwd(),
		"public",
		"uploads",
		year.toString(),
		month
	);
	const storagePath = join(uploadDir, filename);
	const publicUrl = `/${relativePath}`;

	return {
		filename,
		storagePath,
		publicUrl,
		uploadDir,
	};
}

/**
 * Sanitizes filename to prevent path traversal
 * Removes dangerous characters and path segments
 */
export function sanitizeFilename(filename: string): string {
	return filename
		.replace(/\.\./g, "") // Remove parent directory references
		.replace(/[/\\]/g, "") // Remove path separators
		.replace(/[^\w\s.-]/g, "") // Keep only alphanumeric, spaces, dots, dashes
		.trim();
}
