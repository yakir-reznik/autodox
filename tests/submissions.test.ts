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

	// Get admin API key for create-submission-link endpoint
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

async function createPublishedForm(cookie: string, title: string, allowPublicSubmissions = false): Promise<{ id: number }> {
	const form = await api<{ id: number }>("/api/forms", cookie, {
		method: "POST",
		json: { title, description: "vitest submissions test" },
	})
	createdFormIds.push(form.id)

	await api(`/api/forms/${form.id}`, cookie, {
		method: "PATCH",
		json: { status: "published", allowPublicSubmissions },
	})

	return form
}

describe("Form submissions", () => {
	describe("Public submission flow", () => {
		let formId: number

		beforeAll(async () => {
			const form = await createPublishedForm(adminCookie, "[VITEST] public submissions form", true)
			formId = form.id
		})

		it("public submit to published form with allowPublicSubmissions → 200", async () => {
			const res = await unauthRequest(`/api/forms/${formId}/submit`, {
				method: "POST",
				json: { submissionData: { answer: "hello" } },
			})
			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
		})

		it("public submit rejected when allowPublicSubmissions is false → 403", async () => {
			const restrictedForm = await createPublishedForm(adminCookie, "[VITEST] no public submit", false)

			const res = await unauthRequest(`/api/forms/${restrictedForm.id}/submit`, {
				method: "POST",
				json: { submissionData: { answer: "hello" } },
			})
			expect(res.status).toBe(403)
		})
	})

	describe("Draft form guard", () => {
		it("submitting to a draft form is rejected → 400", async () => {
			const form = await api<{ id: number }>("/api/forms", adminCookie, {
				method: "POST",
				json: { title: "[VITEST] draft form submit test" },
			})
			createdFormIds.push(form.id)

			const res = await unauthRequest(`/api/forms/${form.id}/submit`, {
				method: "POST",
				json: { submissionData: {} },
			})
			expect(res.status).toBe(400)
		})
	})

	describe("Token-based submission flow", () => {
		let formId: number
		let token: string

		beforeAll(async () => {
			const form = await createPublishedForm(adminCookie, "[VITEST] token submission form")
			formId = form.id

			// Create a submission link using API key auth
			const linkResult = await api<{ token: string }>(`/api/forms/${formId}/create-submission-link`, "", {
				method: "POST",
				apiKey: adminApiKey,
				json: { name: "[VITEST] test submission" },
			})
			token = linkResult.token
		})

		it("start endpoint transitions status from pending to in_progress", async () => {
			const res = await unauthRequest(`/api/submissions/${token}/start`, { method: "POST" })
			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.status).toBe("in_progress")
		})

		it("calling start again when already in_progress is idempotent → 200", async () => {
			const res = await unauthRequest(`/api/submissions/${token}/start`, { method: "POST" })
			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.status).toBe("in_progress")
		})

		it("submit with valid token locks the submission → 200", async () => {
			const res = await unauthRequest(`/api/forms/${formId}/submit`, {
				method: "POST",
				json: { submissionData: { answer: "done" }, token },
			})
			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.success).toBe(true)
		})

		it("submitting a locked submission is rejected → 403", async () => {
			const res = await unauthRequest(`/api/forms/${formId}/submit`, {
				method: "POST",
				json: { submissionData: { answer: "again" }, token },
			})
			expect(res.status).toBe(403)
		})
	})

	describe("Submission management", () => {
		let formId: number
		let token: string

		beforeAll(async () => {
			const form = await createPublishedForm(adminCookie, "[VITEST] submission management form")
			formId = form.id

			const linkResult = await api<{ token: string }>(`/api/forms/${formId}/create-submission-link`, "", {
				method: "POST",
				apiKey: adminApiKey,
				json: { name: "[VITEST] mgmt submission" },
			})
			token = linkResult.token
		})

		it("admin can GET submission details", async () => {
			const result = await api<{ success: boolean; data: { submission: { token: string } } }>(
				`/api/submissions/${token}/details`,
				adminCookie,
			)
			expect(result.success).toBe(true)
			expect(result.data.submission.token).toBe(token)
		})

		it("non-owner without manage_submissions permission gets 403", async () => {
			const res = await apiRequest(`/api/submissions/${token}/details`, userCookie)
			expect(res.status).toBe(403)
		})

		it("admin can archive and unarchive a submission", async () => {
			const archive = await api<{ isArchived: boolean }>(
				`/api/submissions/${token}/archive`,
				adminCookie,
				{ method: "PATCH" },
			)
			expect(archive.isArchived).toBe(true)

			const unarchive = await api<{ isArchived: boolean }>(
				`/api/submissions/${token}/archive`,
				adminCookie,
				{ method: "PATCH" },
			)
			expect(unarchive.isArchived).toBe(false)
		})
	})
})
