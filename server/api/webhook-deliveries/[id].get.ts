import { db } from "~~/server/db";
import { webhookDeliveriesTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";
import { H3Error, createError, getRouterParam } from "h3";

export default defineEventHandler(async (event) => {
	try {
		const { user } = await requireUserSession(event);

		if (user.role !== "admin") {
			throw createError({ statusCode: 403, message: "Forbidden" });
		}

		const id = Number(getRouterParam(event, "id"));
		if (!id || isNaN(id)) {
			throw createError({ statusCode: 400, message: "Invalid delivery ID" });
		}

		const [delivery] = await db
			.select({
				id: webhookDeliveriesTable.id,
				webhookUrl: webhookDeliveriesTable.webhookUrl,
				status: webhookDeliveriesTable.status,
				httpStatusCode: webhookDeliveriesTable.httpStatusCode,
				errorMessage: webhookDeliveriesTable.errorMessage,
				requestPayload: webhookDeliveriesTable.requestPayload,
				requestHeaders: webhookDeliveriesTable.requestHeaders,
				responseBody: webhookDeliveriesTable.responseBody,
				responseHeaders: webhookDeliveriesTable.responseHeaders,
				retryCount: webhookDeliveriesTable.retryCount,
				deliveredAt: webhookDeliveriesTable.deliveredAt,
				createdAt: webhookDeliveriesTable.createdAt,
			})
			.from(webhookDeliveriesTable)
			.where(eq(webhookDeliveriesTable.id, id));

		if (!delivery) {
			throw createError({ statusCode: 404, message: "Delivery not found" });
		}

		return { success: true, data: delivery };
	} catch (error) {
		if (error instanceof H3Error) throw error;
		console.error(error);
		setResponseStatus(event, 500);
		return { success: false, message: "Internal server error" };
	}
});
