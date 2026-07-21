import { and, inArray, lt } from "drizzle-orm";
import { db } from "~~/server/db";
import { submissionsTable } from "~~/server/db/schema";

type ExpirableSubmission = {
	status: string;
	expiresAt: Date | string | null;
};

export function isSubmissionExpired(submission: ExpirableSubmission, now = new Date()) {
	return submission.status === "expired" || (
		!!submission.expiresAt && new Date(submission.expiresAt) < now
	);
}

export async function expireOldSubmissions(now = new Date()) {
	const result = await db
		.update(submissionsTable)
		.set({ status: "expired" })
		.where(
			and(
				lt(submissionsTable.expiresAt, now),
				inArray(submissionsTable.status, ["pending", "in_progress"]),
			),
		);

	return Number(result[0].affectedRows ?? 0);
}
