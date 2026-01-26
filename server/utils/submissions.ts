import { db } from "~~/server/db";
import {
	submissionsTable,
	formEntrancesTable,
	formsTable,
	formElementsTable,
	webhookDeliveriesTable,
} from "~~/server/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { createError } from "h3";
import type {
	SubmissionTimelineEvent,
	SubmissionLifecycleEvent,
	SubmissionEntranceEvent,
	SubmissionWebhookEvent,
} from "~/app/types/submission-timeline";

export type SubmissionData = {
	submission: {
		id: number;
		token: string;
		formId: number;
		prefillData: Record<string, unknown> | null;
		additionalData: Record<string, unknown> | null;
		createdByUserId: number | null;
		expiresAt: Date;
		status: string;
		submissionData: Record<string, unknown> | null;
		createdAt: Date;
		startedAt: Date | null;
		submittedAt: Date | null;
		lockedAt: Date | null;
	};
	form: {
		id: number;
		title: string;
		description: string | null;
		status: string;
		theme: string;
		createdBy: number;
		updatedBy: number | null;
		createdAt: Date;
		updatedAt: Date;
	} | undefined;
	formElements: Array<{
		id: number;
		type: string;
		position: string;
		parentId: number | null;
		name: string | null;
		config: any;
		isRequired: boolean;
	}>;
};

/**
 * Fetch submission data with related form and form elements
 */
export async function getSubmissionDataByToken(token: string): Promise<SubmissionData> {
	const [submission] = await db
		.select()
		.from(submissionsTable)
		.where(eq(submissionsTable.token, token))
		.limit(1);

	if (!submission) {
		throw createError({
			statusCode: 404,
			message: "Submission not found",
		});
	}

	const form = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, submission.formId),
	});

	const formElements = await db.query.formElementsTable.findMany({
		where: and(
			eq(formElementsTable.formId, submission.formId),
			eq(formElementsTable.isDeleted, false)
		),
		columns: {
			id: true,
			type: true,
			position: true,
			parentId: true,
			name: true,
			config: true,
			isRequired: true,
		},
		orderBy: [asc(formElementsTable.position)],
	});

	return {
		submission,
		form,
		formElements,
	};
}

/**
 * Fetch all form entrances for a submission by token
 */
export async function getSubmissionEntrancesByToken(token: string) {
	const entrances = await db
		.select()
		.from(formEntrancesTable)
		.where(eq(formEntrancesTable.sessionToken, token))
		.orderBy(asc(formEntrancesTable.timestamp));

	return entrances;
}

/**
 * Build a comprehensive timeline of submission events
 */
export async function getSubmissionTimeline(token: string): Promise<SubmissionTimelineEvent[]> {
	// Fetch submission data
	const { submission } = await getSubmissionDataByToken(token);

	// Fetch webhook deliveries
	const webhookDeliveries = await db
		.select({
			id: webhookDeliveriesTable.id,
			webhookUrl: webhookDeliveriesTable.webhookUrl,
			status: webhookDeliveriesTable.status,
			httpStatusCode: webhookDeliveriesTable.httpStatusCode,
			errorMessage: webhookDeliveriesTable.errorMessage,
			retryCount: webhookDeliveriesTable.retryCount,
			deliveredAt: webhookDeliveriesTable.deliveredAt,
			createdAt: webhookDeliveriesTable.createdAt,
		})
		.from(webhookDeliveriesTable)
		.where(eq(webhookDeliveriesTable.submissionId, submission.id))
		.orderBy(asc(webhookDeliveriesTable.createdAt));

	// Build lifecycle events array
	const lifecycleEvents: SubmissionLifecycleEvent[] = [];

	if (submission.createdAt) {
		lifecycleEvents.push({
			type: "lifecycle",
			event: "created",
			timestamp: submission.createdAt,
		});
	}

	if (submission.startedAt) {
		lifecycleEvents.push({
			type: "lifecycle",
			event: "started",
			timestamp: submission.startedAt,
		});
	}

	if (submission.submittedAt) {
		lifecycleEvents.push({
			type: "lifecycle",
			event: "submitted",
			timestamp: submission.submittedAt,
			status: submission.status,
		});
	}

	if (submission.lockedAt) {
		lifecycleEvents.push({
			type: "lifecycle",
			event: "locked",
			timestamp: submission.lockedAt,
		});
	}

	if (submission.expiresAt) {
		lifecycleEvents.push({
			type: "lifecycle",
			event: "expires",
			timestamp: submission.expiresAt,
		});
	}

	// Fetch entrances and map to entrance events
	const entrances = await getSubmissionEntrancesByToken(token);
	const entranceEvents: SubmissionEntranceEvent[] = entrances.map((entrance) => ({
		type: "entrance",
		id: entrance.id,
		timestamp: entrance.timestamp,
		ipAddress: entrance.ipAddress,
		userAgent: entrance.userAgent,
		referrer: entrance.referrer,
		isFormLocked: entrance.isFormLocked,
	}));

	// Map webhook deliveries to webhook events
	const webhookEvents: SubmissionWebhookEvent[] = webhookDeliveries.map((delivery) => ({
		type: "webhook",
		id: delivery.id,
		timestamp: delivery.createdAt,
		webhookUrl: delivery.webhookUrl,
		status: delivery.status,
		httpStatusCode: delivery.httpStatusCode,
		errorMessage: delivery.errorMessage,
		retryCount: delivery.retryCount,
		deliveredAt: delivery.deliveredAt,
	}));

	// Combine all events and sort chronologically
	const allEvents: SubmissionTimelineEvent[] = [
		...lifecycleEvents,
		...entranceEvents,
		...webhookEvents,
	];

	// Sort by timestamp ascending (earliest first)
	allEvents.sort((a, b) => {
		const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
		const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
		return timeA - timeB;
	});

	return allEvents;
}
