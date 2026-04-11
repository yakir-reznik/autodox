import { createHash, randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { formsTable, submissionsTable, usersTable } from "~~/server/db/schema";

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
	try {
		const formId = Number(getRouterParam(event, "id"));

		if (isNaN(formId)) {
			setResponseStatus(event, 400);
			return {
				success: false,
				message: "Invalid form ID",
			};
		}

		const apiKey = getHeader(event, "x-api-key");

		// Authenticate user via API key
		if (!apiKey) {
			setResponseStatus(event, 401);
			return {
				success: false,
				message: "API key is required",
			};
		}

		const user = await db.query.usersTable.findFirst({
			where: eq(usersTable.apiKey, apiKey),
		});

		if (!user) {
			setResponseStatus(event, 401);
			return {
				success: false,
				message: "Invalid API key",
			};
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

		const form = await db.query.formsTable.findFirst({
			where: eq(formsTable.id, formId),
		});

		if (!form) {
			setResponseStatus(event, 404);
			return {
				success: false,
				message: "Form not found",
			};
		}

		if (form.status !== "published") {
			setResponseStatus(event, 400);
			return {
				success: false,
				message: "Form must be published",
			};
		}

		const token = generateToken();
		const expiresAt = new Date(Date.now() + TTL_MS);

		// Determine webhook URL: request param > form default > null
		let webhookUrl: string | null = null;
		if (body?.webhook_url) {
			if (!validateWebhookUrl(body.webhook_url)) {
				setResponseStatus(event, 400);
				return {
					success: false,
					message: "Invalid webhook URL format",
				};
			}
			webhookUrl = body.webhook_url;
		} else if (form.webhookUrl) {
			webhookUrl = form.webhookUrl;
		}

		const sortKeys = (obj: Record<string, unknown>) =>
			Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));

		await db.insert(submissionsTable).values({
			token,
			formId,
			name: body?.name ?? null,
			externalId: body?.externalId ?? null,
			prefillData: body?.prefill ? sortKeys(body.prefill) : null,
			additionalData: body?.additionalData ? sortKeys(body.additionalData) : null,
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
	} catch (error: any) {
		setResponseStatus(event, error.statusCode || 500);
		return {
			success: false,
			message: error.message || "Internal server error",
		};
	}
});
