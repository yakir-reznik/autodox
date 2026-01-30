import { db } from "~~/server/db";
import { formsTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	// Require authentication
	const session = await getUserSession(event);
	if (!session.user) {
		throw createError({
			statusCode: 401,
			message: "Authentication required",
		});
	}

	const id = Number(getRouterParam(event, "id"));
	if (isNaN(id)) {
		throw createError({
			statusCode: 400,
			message: "Invalid form ID",
		});
	}

	const form = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, id),
	});

	if (!form) {
		throw createError({
			statusCode: 404,
			message: "Form not found",
		});
	}

	// Return form settings including plain text password
	return {
		id: form.id,
		title: form.title,
		description: form.description,
		status: form.status,
		theme: form.theme,
		webhookUrl: form.webhookUrl,
		webhookIncludePdf: form.webhookIncludePdf,
		password: form.password,
		allowPublicSubmissions: form.allowPublicSubmissions,
	};
});
