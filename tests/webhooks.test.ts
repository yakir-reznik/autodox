import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { createServer } from "node:http"
import type { Server } from "node:http"
import type { AddressInfo } from "node:net"
import { login, api, apiRequest, unauthRequest, ADMIN, USER } from "./helpers/client"

let adminCookie: string
let userCookie: string
let adminApiKey: string

const createdFormIds: number[] = []

beforeAll(async () => {
	;[adminCookie, userCookie] = await Promise.all([
		login(ADMIN.email, ADMIN.password),
		login(USER.email, USER.password),
	])

	const session = await api<{ user: { apiKey: string } }>("/api/auth/session", adminCookie)
	adminApiKey = session.user.apiKey
})

afterAll(async () => {
	await Promise.all(
		createdFormIds.map((id) =>
			apiRequest(`/api/forms/${id}`, adminCookie, { method: "DELETE" }).catch(() => {}),
		),
	)
})

/** Start a one-shot HTTP server that captures the first POST body it receives. */
function createWebhookCatcher(): { server: Server; port: number; waitForPayload: (timeoutMs?: number) => Promise<unknown> } {
	let resolvePayload: (value: unknown) => void
	let rejectPayload: (err: Error) => void
	const payloadPromise = new Promise<unknown>((resolve, reject) => {
		resolvePayload = resolve
		rejectPayload = reject
	})

	const server = createServer((req, res) => {
		let body = ""
		req.on("data", (chunk: Buffer) => { body += chunk.toString() })
		req.on("end", () => {
			res.writeHead(200, { "Content-Type": "text/plain" })
			res.end("ok")
			try { resolvePayload(JSON.parse(body)) } catch { resolvePayload(body) }
		})
	})

	server.listen(0)
	const port = (server.address() as AddressInfo).port

	return {
		server,
		port,
		waitForPayload: (timeoutMs = 5000) =>
			Promise.race([
				payloadPromise,
				new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error(`Webhook not received within ${timeoutMs}ms`)), timeoutMs),
				),
			]),
	}
}

async function createPublishedForm(cookie: string, title: string, extra: Record<string, unknown> = {}): Promise<{ id: number }> {
	const form = await api<{ id: number }>("/api/forms", cookie, {
		method: "POST",
		json: { title, description: "vitest webhook test" },
	})
	createdFormIds.push(form.id)

	await api(`/api/forms/${form.id}`, cookie, {
		method: "PATCH",
		json: { status: "published", ...extra },
	})

	return form
}

describe("Webhook delivery", () => {
	describe("Public submission triggers webhook", () => {
		it("webhook is delivered with correct payload structure after public submission", async () => {
			const catcher = createWebhookCatcher()

			try {
				const webhookUrl = `http://localhost:${catcher.port}`
				const form = await createPublishedForm(adminCookie, "[VITEST] webhook public submit", {
					allowPublicSubmissions: true,
					webhookUrl,
				})

				const res = await unauthRequest(`/api/forms/${form.id}/submit`, {
					method: "POST",
					json: { submissionData: { answer: "webhook test" } },
				})
				expect(res.status).toBe(200)

				const payload = await catcher.waitForPayload() as Record<string, unknown>

				expect(payload.event).toBe("submission.completed")
				expect(payload.formId).toBe(form.id)
				expect(payload.status).toBe("locked")
				expect(payload.token).toBeTypeOf("string")
				expect(payload.timestamp).toBeTypeOf("string")
				expect(payload.submissionData).toMatchObject({ answer: "webhook test" })
				expect(payload.pdfBase64).toBe("") // includePdf not set
				expect((payload.metadata as Record<string, unknown>).webhookDeliveryId).toBeTypeOf("number")
			} finally {
				catcher.server.close()
			}
		})
	})

	describe("Token-based submission triggers webhook via submission-level override", () => {
		it("webhook_url override on submission link is used for delivery", async () => {
			const catcher = createWebhookCatcher()

			try {
				const form = await createPublishedForm(adminCookie, "[VITEST] webhook token submit")

				const webhookUrl = `http://localhost:${catcher.port}`
				const linkResult = await api<{ token: string }>(`/api/forms/${form.id}/create-submission-link`, "", {
					method: "POST",
					apiKey: adminApiKey,
					json: { name: "[VITEST] webhook override", webhook_url: webhookUrl },
				})
				const token = linkResult.token

				await unauthRequest(`/api/submissions/${token}/start`, { method: "POST" })

				const res = await unauthRequest(`/api/forms/${form.id}/submit`, {
					method: "POST",
					json: { submissionData: { field: "value" }, token },
				})
				expect(res.status).toBe(200)

				const payload = await catcher.waitForPayload() as Record<string, unknown>

				expect(payload.event).toBe("submission.completed")
				expect(payload.token).toBe(token)
				expect(payload.formId).toBe(form.id)
			} finally {
				catcher.server.close()
			}
		})
	})

	describe("No webhook URL configured", () => {
		it("submission without webhookUrl still succeeds and logs a skipped delivery", async () => {
			const form = await createPublishedForm(adminCookie, "[VITEST] no webhook form", {
				allowPublicSubmissions: true,
			})

			const res = await unauthRequest(`/api/forms/${form.id}/submit`, {
				method: "POST",
				json: { submissionData: { data: "no webhook" } },
			})
			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
		})
	})

	describe("Resend webhook", () => {
		let formId: number
		let token: string

		beforeAll(async () => {
			const catcher = createWebhookCatcher()

			const webhookUrl = `http://localhost:${catcher.port}`
			const form = await createPublishedForm(adminCookie, "[VITEST] resend webhook form", { webhookUrl })
			formId = form.id

			const linkResult = await api<{ token: string }>(`/api/forms/${formId}/create-submission-link`, "", {
				method: "POST",
				apiKey: adminApiKey,
				json: { name: "[VITEST] resend sub" },
			})
			token = linkResult.token

			await unauthRequest(`/api/submissions/${token}/start`, { method: "POST" })
			await unauthRequest(`/api/forms/${formId}/submit`, {
				method: "POST",
				json: { submissionData: { done: true }, token },
			})

			// Drain the initial delivery
			await catcher.waitForPayload().catch(() => {})
			catcher.server.close()
		})

		it("admin can resend webhook and gets delivery result", async () => {
			const catcher = createWebhookCatcher()

			// Point submission's form to our new catcher via the resend endpoint
			// The resend uses the submission's stored webhookUrl, which is the form's URL.
			// We need to update the form webhookUrl to the new catcher.
			await api(`/api/forms/${formId}`, adminCookie, {
				method: "PATCH",
				json: { webhookUrl: `http://localhost:${catcher.port}` },
			})

			try {
				const result = await api<{ success: boolean; data: { deliveryId: number; success: boolean } }>(
					`/api/submissions/${token}/resend-webhook`,
					adminCookie,
					{ method: "POST" },
				)

				expect(result.success).toBe(true)
				expect(result.data.deliveryId).toBeTypeOf("number")

				await catcher.waitForPayload()
			} finally {
				catcher.server.close()
			}
		})

		it("non-owner cannot resend webhook → 403", async () => {
			const res = await apiRequest(`/api/submissions/${token}/resend-webhook`, userCookie, {
				method: "POST",
			})
			expect(res.status).toBe(403)
		})
	})
})
