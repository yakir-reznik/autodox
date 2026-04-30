import { createHash, randomBytes } from "crypto";
import { db } from "~~/server/db";
import { submissionsTable } from "~~/server/db/schema";
import { requireApiKeyFormPermission } from "~~/server/utils/authorization";

const TTL_DAYS = 14;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

function generateToken(): string {
	const timestamp = Date.now().toString();
	const random = randomBytes(16).toString("hex");
	return createHash("sha256")
		.update(`${timestamp}-${random}`)
		.digest("hex")
		.substring(0, 32);
}

function validateWebhookUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

export default defineEventHandler(async (event) => {
	const formId = Number(getRouterParam(event, "id"));

	if (isNaN(formId)) {
		throw createError({ statusCode: 400, message: "Invalid form ID" });
	}

	const { user, form } = await requireApiKeyFormPermission(event, formId, "create_submissions");

	if (form.status !== "published") {
		throw createError({ statusCode: 400, message: "Form must be published" });
	}

	const body = await readBody<{
		name?: string;
		externalId?: string;
		prefill?: Record<string, unknown>;
		additionalData?: Record<string, unknown>;
		webhook_url?: string;
		webhook_include_pdf?: boolean;
		password?: string;
	}>(event);

	let webhookUrl: string | null = null;
	if (body?.webhook_url) {
		if (!validateWebhookUrl(body.webhook_url)) {
			throw createError({ statusCode: 400, message: "Invalid webhook URL format" });
		}
		webhookUrl = body.webhook_url;
	}

	const token = generateToken();
	const expiresAt = new Date(Date.now() + TTL_MS);

	await db.insert(submissionsTable).values({
		token,
		formId,
		name: body?.name ?? null,
		externalId: body?.externalId ?? null,
		prefillData: body?.prefill ?? null,
		additionalData: body?.additionalData ?? null,
		createdByUserId: user.id,
		expiresAt,
		status: "pending",
		createdAt: new Date(),
		webhookUrl,
		webhookIncludePdf: body?.webhook_include_pdf ?? null,
		password: body?.password ?? null,
	});

	const baseUrl = getRequestURL(event).origin;
	const link = `${baseUrl}/fill/${formId}?token=${token}`;

	return {
		success: true,
		link,
		token,
		formId,
		expiresAt: expiresAt.toISOString(),
	};
});
