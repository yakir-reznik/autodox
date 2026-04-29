import { deliverWebhook } from "~~/server/utils/webhookDelivery";
import { resolveFormSettings } from "~~/server/utils/overrideableFormSettings";
import { requireSubmissionPermission } from "~~/server/utils/authorization";

export default defineEventHandler(async (event) => {
	const token = getRouterParam(event, "token");

	if (!token) {
		throw createError({ statusCode: 400, message: "Submission token is required" });
	}

	const { submission, form } = await requireSubmissionPermission(event, token, "manage_submissions");

	const { webhookIncludePdf } = resolveFormSettings(form, submission);

	const result = await deliverWebhook(submission.id, submission.webhookUrl, { includePdf: !!webhookIncludePdf });

	return { success: true, data: result };
});
