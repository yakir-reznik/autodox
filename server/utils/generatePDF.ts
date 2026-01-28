import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";
import { getSubmissionDataByToken } from "~~/server/utils/submissions";

// Cache configuration
const PDF_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const PDF_CACHE_DIR = path.join(process.cwd(), ".cache", "pdfs");

/**
 * Ensures the cache directory exists
 */
function ensureCacheDir(): void {
	if (!fs.existsSync(PDF_CACHE_DIR)) {
		fs.mkdirSync(PDF_CACHE_DIR, { recursive: true });
	}
}

/**
 * Get the cache file path for a given token
 */
function getCachePath(token: string): string {
	return path.join(PDF_CACHE_DIR, `${token}.pdf`);
}

/**
 * Check if a cached PDF exists and is still valid
 */
function getCachedPDF(token: string): Buffer | null {
	const cachePath = getCachePath(token);

	if (!fs.existsSync(cachePath)) {
		return null;
	}

	const stats = fs.statSync(cachePath);
	const age = Date.now() - stats.mtimeMs;

	if (age > PDF_CACHE_TTL_MS) {
		// Cache expired, delete it
		fs.unlinkSync(cachePath);
		return null;
	}

	return fs.readFileSync(cachePath);
}

/**
 * Save a PDF to cache
 */
function cachePDF(token: string, buffer: Buffer): void {
	console.log("[PDF Generation] Caching PDF for token:", token);
	ensureCacheDir();
	const cachePath = getCachePath(token);
	fs.writeFileSync(cachePath, buffer);
}

/**
 * Clean up expired PDFs from cache
 */
export function cleanupExpiredPDFs(): void {
	console.log("[PDF Cache] Starting cleanup of expired PDFs");

	if (!fs.existsSync(PDF_CACHE_DIR)) {
		return;
	}

	const files = fs.readdirSync(PDF_CACHE_DIR);
	let deletedCount = 0;

	for (const file of files) {
		if (!file.endsWith(".pdf")) {
			continue;
		}

		const filePath = path.join(PDF_CACHE_DIR, file);
		const stats = fs.statSync(filePath);
		const age = Date.now() - stats.mtimeMs;

		if (age > PDF_CACHE_TTL_MS) {
			fs.unlinkSync(filePath);
			deletedCount++;
			console.log(`[PDF Cache] Deleted expired PDF: ${file}`);
		}
	}

	console.log(`[PDF Cache] Cleanup complete. Deleted ${deletedCount} expired PDF(s)`);
}

/**
 * Generates a PDF by rendering the print view with Puppeteer
 * Uses disk cache for locked submissions to avoid regenerating
 */
export async function generateSubmissionPDF(token: string): Promise<Buffer> {
	// Check cache first
	const cachedPDF = getCachedPDF(token);
	if (cachedPDF) {
		console.log("[PDF Generation] Returning cached PDF for token:", token);
		return cachedPDF;
	}

	// Get submission to check if locked
	const submissionData = await getSubmissionDataByToken(token);
	const isLocked = submissionData.submission.status === "locked";

	// Determine base URL
	const baseUrl = process.env.BASE_URL || "http://localhost:3000";

	const browser = await puppeteer.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
	});

	try {
		const page = await browser.newPage();

		// Set authentication header for internal access
		await page.setExtraHTTPHeaders({
			"X-Puppeteer-Secret": process.env.PUPPETEER_SECRET || "",
		});

		// Navigate to print view
		await page.goto(`${baseUrl}/print/${token}`, {
			waitUntil: "networkidle0",
		});

		// Wait for fonts to be loaded
		// @ts-expect-error - document exists in browser context inside page.evaluate()
		await page.evaluate(() => document.fonts.ready);

		// Generate PDF
		const pdfBuffer = Buffer.from(
			await page.pdf({
				format: "A4",
				printBackground: true,
			}),
		);

		// Cache the PDF only if submission is locked (cannot change anymore)
		if (isLocked) {
			cachePDF(token, pdfBuffer);
		}

		console.log("[PDF Generation] Generated PDF, locked:", isLocked, "token:", token);

		return pdfBuffer;
	} finally {
		await browser.close();
	}
}
