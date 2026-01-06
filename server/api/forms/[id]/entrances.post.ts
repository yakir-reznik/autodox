import { db } from "~~/server/db";
import { formEntrancesTable } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
	const formId = Number(getRouterParam(event, "id"));

	if (isNaN(formId)) {
		throw createError({
			statusCode: 400,
			message: "Invalid form ID",
		});
	}

	const body = await readBody(event);
	const { sessionToken } = body;

	// Extract request metadata
	const headers = getHeaders(event);
	const ipAddress = getRequestIP(event, { xForwardedFor: true }) || null;
	const userAgent = headers["user-agent"] || null;
	const referrer = headers.referer || headers.referrer || null;

	// Insert entrance record
	const [entrance] = await db.insert(formEntrancesTable).values({
		sessionToken: sessionToken || null,
		formId,
		ipAddress,
		userAgent,
		referrer,
		isFormLocked: false,
	});

	return {
		success: true,
		entranceId: entrance.insertId,
	};
});
