import { createHash, randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { formsTable, submissionsTable } from "~~/server/db/schema";
import { deliverWebhook } from "~~/server/utils/webhookDelivery";

function generateToken(): string {
	const timestamp = Date.now().toString();
	const random = randomBytes(16).toString("hex");
	return createHash("sha256")
		.update(`${timestamp}-${random}`)
		.digest("hex")
		.substring(0, 32);
}

export default defineEventHandler(async (event) => {
	const formId = Number(getRouterParam(event, "id"));
	const body = await readBody(event);
	const { submissionData, token } = body;

	if (isNaN(formId)) {
		throw createError({ statusCode: 400, message: "Invalid form ID" });
	}

	if (!submissionData || typeof submissionData !== "object") {
		throw createError({ statusCode: 400, message: "Submission data is required" });
	}

	// Get form to check settings
	const form = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, formId),
	});

	if (!form) {
		throw createError({ statusCode: 404, message: "Form not found" });
	}

	if (form.status !== "published") {
		throw createError({ statusCode: 400, message: "Form is not published" });
	}

	const now = new Date();

	// If token provided, update existing submission
	if (token) {
		const [submission] = await db
			.select()
			.from(submissionsTable)
			.where(eq(submissionsTable.token, token))
			.limit(1);

		if (!submission) {
			throw createError({ statusCode: 404, message: "Submission not found" });
		}

		if (submission.formId !== formId) {
			throw createError({ statusCode: 400, message: "Token does not match form" });
		}

		if (submission.status === "locked") {
			throw createError({ statusCode: 403, message: "This submission is locked and cannot be modified" });
		}

		if (submission.expiresAt && new Date(submission.expiresAt) < now) {
			throw createError({ statusCode: 403, message: "This submission link has expired" });
		}

		// Update existing submission
		await db
			.update(submissionsTable)
			.set({
				submissionData,
				status: "locked",
				submittedAt: now,
				lockedAt: now,
			})
			.where(eq(submissionsTable.token, token));

		// Trigger webhook
		if (submission.webhookUrl) {
			const { webhookIncludePdf } = resolveFormSettings(form, submission);
			deliverWebhook(submission.id, submission.webhookUrl, { includePdf: !!webhookIncludePdf })
				.then((result) => {
					console.log(`[Webhook] Delivery completed for submission ${submission.id}:`, result);
				})
				.catch((error) => {
					console.error(`[Webhook] Delivery failed for submission ${submission.id}:`, error);
				});
		}

		return { success: true, message: "Form submitted successfully" };
	}

	// No token - public submission flow
	if (!form.allowPublicSubmissions) {
		throw createError({
			statusCode: 403,
			message: "טופס זה דורש קישור אישי לשליחה",
		});
	}

	// Create new public submission
	const newToken = generateToken();
	const { webhookUrl, webhookIncludePdf } = resolveFormSettings(form);

	const [insertResult] = await db.insert(submissionsTable).values({
		token: newToken,
		formId,
		isPublic: true,
		createdByUserId: null,
		expiresAt: now,
		status: "locked",
		submissionData,
		submittedAt: now,
		lockedAt: now,
		webhookUrl: webhookUrl as string | null,
	});

	const submissionId = insertResult.insertId;

	// Trigger webhook if configured
	if (webhookUrl) {
		deliverWebhook(submissionId, webhookUrl as string, { includePdf: !!webhookIncludePdf })
			.then((result) => {
				console.log(`[Webhook] Delivery completed for public submission ${submissionId}:`, result);
			})
			.catch((error) => {
				console.error(`[Webhook] Delivery failed for public submission ${submissionId}:`, error);
			});
	}

	return { success: true, message: "Form submitted successfully" };
});
