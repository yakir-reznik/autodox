import { cleanupExpiredPDFs } from "~~/server/utils/generatePDF";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default defineNitroPlugin(() => {
	console.log("[PDF Cache] Initializing daily cleanup job");

	// Run cleanup immediately on startup
	cleanupExpiredPDFs();

	// Schedule cleanup to run once every 24 hours
	setInterval(() => {
		cleanupExpiredPDFs();
	}, ONE_DAY_MS);
});
