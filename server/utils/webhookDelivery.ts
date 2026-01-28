import { db } from "~~/server/db";
import {
	webhookDeliveriesTable,
	submissionsTable,
	formsTable,
} from "~~/server/db/schema";
import { eq } from "drizzle-orm";
import { queuePDFGeneration } from "./pdfQueue";
import { getSubmissionEntrancesByToken } from "./submissions";

interface WebhookPayload {
	event: string;
	timestamp: string;
	submissionId: number;
	formId: number;
	token: string;
	status: string;
	submissionData: Record<string, unknown> | null;
	prefillData: Record<string, unknown> | null;
	additionalData: Record<string, unknown> | null;
	entrances: Array<{
		id: number;
		timestamp: Date;
		ipAddress: string | null;
		userAgent: string | null;
		referrer: string | null;
	}>;
	pdfBase64: string;
	metadata: {
		webhookDeliveryId: number;
		retryAttempt: number;
		submittedAt: string | null;
	};
}

interface DeliveryResult {
	success: boolean;
	httpStatusCode?: number;
	responseBody?: string;
	responseHeaders?: Record<string, string>;
	errorMessage?: string;
}

/**
 * Attempt to deliver webhook with optional retry
 */
async function attemptDelivery(
	webhookUrl: string,
	payload: WebhookPayload,
	requestHeaders: Record<string, string>
): Promise<DeliveryResult> {
	try {
		const response = await fetch(webhookUrl, {
			method: "POST",
			headers: requestHeaders,
			body: JSON.stringify(payload),
			signal: AbortSignal.timeout(30000), // 30 second timeout
		});

		// Convert headers to plain object
		const responseHeaders: Record<string, string> = {};
		response.headers.forEach((value, key) => {
			responseHeaders[key] = value;
		});

		const responseBody = await response.text();

		if (response.ok) {
			return {
				success: true,
				httpStatusCode: response.status,
				responseBody,
				responseHeaders,
			};
		} else {
			return {
				success: false,
				httpStatusCode: response.status,
				responseBody,
				responseHeaders,
				errorMessage: `HTTP ${response.status}: ${response.statusText}`,
			};
		}
	} catch (error: any) {
		return {
			success: false,
			errorMessage: error.message || "Network error",
		};
	}
}

/**
 * Deliver webhook for a submission
 * If webhookUrl is null, logs to table but doesn't attempt delivery
 */
export async function deliverWebhook(
	submissionId: number,
	webhookUrl: string | null
): Promise<{ deliveryId: number; success: boolean }> {
	// Fetch submission data
	const [submission] = await db
		.select()
		.from(submissionsTable)
		.where(eq(submissionsTable.id, submissionId))
		.limit(1);

	if (!submission) {
		throw new Error(`Submission ${submissionId} not found`);
	}

	// Fetch form data
	const [form] = await db
		.select()
		.from(formsTable)
		.where(eq(formsTable.id, submission.formId))
		.limit(1);

	// Fetch entrances data
	const allEntrances = await getSubmissionEntrancesByToken(submission.token);
	const entrances = allEntrances.map((entrance) => ({
		id: entrance.id,
		timestamp: entrance.timestamp,
		ipAddress: entrance.ipAddress,
		userAgent: entrance.userAgent,
		referrer: entrance.referrer,
	}));

	// Generate PDF
	let pdfBase64 = "";
	try {
		const pdfBuffer = await queuePDFGeneration(submission.token);
		pdfBase64 = pdfBuffer.toString("base64");
	} catch (error) {
		console.error("Failed to generate PDF for webhook:", error);
	}

	// Build payload
	const payload: WebhookPayload = {
		event: "submission.completed",
		timestamp: new Date().toISOString(),
		submissionId: submission.id,
		formId: submission.formId,
		token: submission.token,
		status: submission.status,
		submissionData: submission.submissionData,
		prefillData: submission.prefillData,
		additionalData: submission.additionalData,
		entrances,
		pdfBase64,
		metadata: {
			webhookDeliveryId: 0, // Will be updated after insert
			retryAttempt: 0,
			submittedAt: submission.submittedAt?.toISOString() || null,
		},
	};

	// Build request headers
	const requestHeaders: Record<string, string> = {
		"Content-Type": "application/json",
		"User-Agent": "Autodox-Webhook/1.0",
		"X-Webhook-Event": "submission.completed",
		"X-Submission-Id": String(submission.id),
		"X-Form-Id": String(submission.formId),
	};

	// If no webhook URL, log to table but mark as success with no delivery
	if (!webhookUrl) {
		const [insertResult] = await db.insert(webhookDeliveriesTable).values({
			submissionId,
			webhookUrl: "none",
			status: "success",
			httpStatusCode: null,
			requestPayload: payload as unknown as Record<string, unknown>,
			requestHeaders,
			responseBody: "No webhook URL configured - skipped delivery",
			responseHeaders: null,
			errorMessage: null,
			retryCount: 0,
			deliveredAt: new Date(),
		});

		return { deliveryId: insertResult.insertId, success: true };
	}

	// Update payload with delivery ID placeholder
	payload.metadata.webhookDeliveryId = 0;

	// Create initial delivery record
	const [insertResult] = await db.insert(webhookDeliveriesTable).values({
		submissionId,
		webhookUrl,
		status: "pending",
		requestPayload: payload as unknown as Record<string, unknown>,
		requestHeaders,
		retryCount: 0,
	});

	const deliveryId = insertResult.insertId;

	// Update payload with actual delivery ID
	payload.metadata.webhookDeliveryId = deliveryId;

	// First attempt
	let result = await attemptDelivery(webhookUrl, payload, requestHeaders);

	// If failed, retry once
	if (!result.success) {
		payload.metadata.retryAttempt = 1;

		// Update record to show retry
		await db
			.update(webhookDeliveriesTable)
			.set({
				status: "retry",
				retryCount: 1,
				errorMessage: result.errorMessage,
				httpStatusCode: result.httpStatusCode,
				responseBody: result.responseBody,
				responseHeaders: result.responseHeaders,
			})
			.where(eq(webhookDeliveriesTable.id, deliveryId));

		// Wait a bit before retry
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Second attempt
		result = await attemptDelivery(webhookUrl, payload, requestHeaders);
	}

	// Update final status
	if (result.success) {
		await db
			.update(webhookDeliveriesTable)
			.set({
				status: "success",
				httpStatusCode: result.httpStatusCode,
				responseBody: result.responseBody,
				responseHeaders: result.responseHeaders,
				errorMessage: null,
				deliveredAt: new Date(),
			})
			.where(eq(webhookDeliveriesTable.id, deliveryId));
	} else {
		await db
			.update(webhookDeliveriesTable)
			.set({
				status: "failed",
				httpStatusCode: result.httpStatusCode,
				responseBody: result.responseBody,
				responseHeaders: result.responseHeaders,
				errorMessage: result.errorMessage,
			})
			.where(eq(webhookDeliveriesTable.id, deliveryId));
	}

	return { deliveryId, success: result.success };
}
