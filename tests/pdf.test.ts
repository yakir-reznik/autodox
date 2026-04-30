import { describe, it, expect, beforeAll, afterAll } from "vitest"
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

async function createLockedSubmission(cookie: string, apiKey: string): Promise<{ formId: number; token: string }> {
	const form = await api<{ id: number }>("/api/forms", cookie, {
		method: "POST",
		json: { title: "[VITEST] pdf test form", description: "vitest pdf test" },
	})
	createdFormIds.push(form.id)

	await api(`/api/forms/${form.id}`, cookie, {
		method: "PATCH",
		json: { status: "published" },
	})

	const linkResult = await api<{ token: string }>(`/api/forms/${form.id}/create-submission-link`, "", {
		method: "POST",
		apiKey,
		json: { name: "[VITEST] pdf sub" },
	})
	const token = linkResult.token

	await unauthRequest(`/api/submissions/${token}/start`, { method: "POST" })
	await unauthRequest(`/api/forms/${form.id}/submit`, {
		method: "POST",
		json: { submissionData: { name: "Test User", email: "test@example.com" }, token },
	})

	return { formId: form.id, token }
}

describe("PDF download", () => {
	describe("Auth guards", () => {
		let token: string

		beforeAll(async () => {
			const result = await createLockedSubmission(adminCookie, adminApiKey)
			token = result.token
		})

		it("unauthenticated request → 401", async () => {
			const res = await unauthRequest(`/api/submissions/${token}/download-pdf`)
			expect(res.status).toBe(401)
		})

		it("user without view_submissions permission → 403", async () => {
			const res = await apiRequest(`/api/submissions/${token}/download-pdf`, userCookie)
			expect(res.status).toBe(403)
		})
	})

	describe("PDF generation smoke test", () => {
		let token: string

		beforeAll(async () => {
			const result = await createLockedSubmission(adminCookie, adminApiKey)
			token = result.token
		})

		it("admin can download a PDF and receives a valid PDF buffer", async () => {
			const res = await apiRequest(`/api/submissions/${token}/download-pdf`, adminCookie)

			expect(res.status).toBe(200)
			expect(res.headers.get("content-type")).toBe("application/pdf")
			expect(res.headers.get("content-disposition")).toContain("attachment")
			expect(res.headers.get("content-disposition")).toContain(".pdf")

			const buffer = Buffer.from(await res.arrayBuffer())
			// PDF files start with the %PDF- magic bytes
			expect(buffer.slice(0, 5).toString()).toBe("%PDF-")
		}, 30_000) // generous timeout for puppeteer
	})
})
