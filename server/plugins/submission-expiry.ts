import { expireOldSubmissions } from "~~/server/utils/submissionExpiry";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let isRunning = false;

async function runSubmissionExpiryJob(trigger: string) {
	if (isRunning) {
		console.log(`[Submission Expiry] Skipping ${trigger} run because a previous run is still active`);
		return;
	}

	isRunning = true;

	try {
		console.log(`[Submission Expiry] Starting ${trigger} run`);
		const expiredCount = await expireOldSubmissions();
		console.log(`[Submission Expiry] ${trigger} run complete. Marked ${expiredCount} submission(s) as expired`);
	} catch (error) {
		console.error(`[Submission Expiry] ${trigger} run failed`, error);
	} finally {
		isRunning = false;
	}
}

export default defineNitroPlugin(() => {
	console.log("[Submission Expiry] Initializing daily expiry job");

	runSubmissionExpiryJob("startup");

	setInterval(() => {
		runSubmissionExpiryJob("scheduled");
	}, ONE_DAY_MS);
});
