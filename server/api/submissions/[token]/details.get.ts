import { db } from "~~/server/db";
import { webhookDeliveriesTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";
import { H3Error, createError, getRouterParam, getHeader, getQuery } from "h3";
import {
	getSubmissionDataByToken,
	getSubmissionEntrancesByToken,
	getSubmissionTimeline,
} from "~/server/utils/submissions";
import type { SubmissionTimelineEvent } from "~/app/types/submission-timeline";

export default defineEventHandler(async (event) => {
	try {
		const token = getRouterParam(event, "token");

		if (!token) {
			throw createError({
				statusCode: 400,
				message: "Submission token is required",
			});
		}

		// Dual authentication: Puppeteer header or admin session
		const puppeteerSecret = getHeader(event, "X-Puppeteer-Secret");

		if (puppeteerSecret) {
			// Puppeteer authentication
			if (puppeteerSecret !== process.env.PUPPETEER_SECRET) {
				throw createError({
					statusCode: 401,
					message: "Invalid Puppeteer secret",
				});
			}
		} else {
			// Admin session authentication
			const { user } = await requireUserSession(event);

			if (user.role !== "admin") {
				throw createError({
					statusCode: 403,
					message: "Only admin users can access this endpoint",
				});
			}
		}

		// Parse query parameter for conditional data inclusion
		const query = getQuery(event);
		const includeParam = (query.include as string) || "all";
		const includeFields = includeParam === "all"
			? ["form", "elements", "submissionEntrances", "submissionTimeline", "webhooks"]
			: includeParam.split(",").map((field) => field.trim());

		// Fetch submission data using shared utility
		const { submission, form, formElements } = await getSubmissionDataByToken(token);

		// Build response object conditionally based on include parameter
		const response: {
			submission: typeof submission;
			form?: typeof form;
			elements?: typeof formElements;
			submissionEntrances?: Awaited<ReturnType<typeof getSubmissionEntrancesByToken>>;
			submissionTimeline?: SubmissionTimelineEvent[];
			webhookDeliveries?: Array<{
				id: number;
				submissionId: number;
				webhookUrl: string;
				status: string;
				httpStatusCode: number | null;
				errorMessage: string | null;
				retryCount: number;
				deliveredAt: Date | null;
				createdAt: Date;
			}>;
		} = {
			submission,
		};

		// Add form if requested
		if (includeFields.includes("form")) {
			response.form = form;
		}

		// Add elements if requested
		if (includeFields.includes("elements")) {
			response.elements = formElements;
		}

		// Add submission entrances if requested
		if (includeFields.includes("submissionEntrances")) {
			response.submissionEntrances = await getSubmissionEntrancesByToken(token);
		}

		// Add submission timeline if requested
		if (includeFields.includes("submissionTimeline")) {
			response.submissionTimeline = await getSubmissionTimeline(token);
		}

		// Add webhook deliveries if requested
		if (includeFields.includes("webhooks")) {
			const webhookDeliveries = await db
				.select({
					id: webhookDeliveriesTable.id,
					submissionId: webhookDeliveriesTable.submissionId,
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
				.orderBy(webhookDeliveriesTable.createdAt);

			response.webhookDeliveries = webhookDeliveries;
		}

		// Maintain backward compatibility: if no params or include=all, return data with old field names
		if (includeParam === "all") {
			return {
				success: true,
				data: {
					submission: response.submission,
					form: response.form,
					entrances: response.submissionEntrances,
					webhookDeliveries: response.webhookDeliveries,
				},
			};
		}

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		if (error instanceof H3Error) {
			throw error;
		}
		console.error(error);
		setResponseStatus(event, 500);
		return {
			success: false,
			message: "Internal server error",
		};
	}
});
