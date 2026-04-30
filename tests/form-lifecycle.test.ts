import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { login, api, apiRequest, ADMIN, USER, USER2 } from "./helpers/client"

let adminCookie: string
let userCookie: string
let user2Cookie: string

const createdFormIds: number[] = []

beforeAll(async () => {
	;[adminCookie, userCookie, user2Cookie] = await Promise.all([
		login(ADMIN.email, ADMIN.password),
		login(USER.email, USER.password),
		login(USER2.email, USER2.password),
	])
})

afterAll(async () => {
	await Promise.all(
		createdFormIds.map((id) =>
			apiRequest(`/api/forms/${id}`, adminCookie, { method: "DELETE" }).catch(() => {}),
		),
	)
})

async function createForm(cookie: string, title: string): Promise<{ id: number; title: string }> {
	const form = await api<{ id: number; title: string }>("/api/forms", cookie, {
		method: "POST",
		json: { title, description: "vitest lifecycle test" },
	})
	createdFormIds.push(form.id)
	return form
}

describe("Form lifecycle", () => {
	describe("Form duplication", () => {
		let sourceFormId: number

		beforeAll(async () => {
			const form = await createForm(userCookie, "[VITEST] source form for duplication")
			sourceFormId = form.id
		})

		it("owner can duplicate their form and gets a new form with '(העתק)' in title", async () => {
			const copy = await api<{ id: number; title: string }>(
				`/api/forms/${sourceFormId}/duplicate`,
				userCookie,
				{ method: "POST" },
			)
			createdFormIds.push(copy.id)
			expect(copy.id).toBeTypeOf("number")
			expect(copy.id).not.toBe(sourceFormId)
			expect(copy.title).toContain("העתק")
		})

		it("duplicated form is in draft status regardless of source status", async () => {
			// Publish the source form first
			await api(`/api/forms/${sourceFormId}`, userCookie, {
				method: "PATCH",
				json: { status: "published" },
			})

			const copy = await api<{ id: number; status: string }>(
				`/api/forms/${sourceFormId}/duplicate`,
				userCookie,
				{ method: "POST" },
			)
			createdFormIds.push(copy.id)
			expect(copy.status).toBe("draft")
		})

		it("non-owner without view permission cannot duplicate → 403", async () => {
			const res = await apiRequest(`/api/forms/${sourceFormId}/duplicate`, user2Cookie, {
				method: "POST",
			})
			expect(res.status).toBe(403)
		})

		it("admin can duplicate any form", async () => {
			const copy = await api<{ id: number }>(
				`/api/forms/${sourceFormId}/duplicate`,
				adminCookie,
				{ method: "POST" },
			)
			createdFormIds.push(copy.id)
			expect(copy.id).toBeTypeOf("number")
		})
	})

	describe("Status transitions", () => {
		let formId: number

		beforeAll(async () => {
			const form = await createForm(userCookie, "[VITEST] status transition test")
			formId = form.id
		})

		it("form is created with draft status", async () => {
			const form = await api<{ status: string }>(`/api/forms/${formId}`, userCookie)
			expect(form.status).toBe("draft")
		})

		it("owner can publish a draft form", async () => {
			const updated = await api<{ status: string }>(`/api/forms/${formId}`, userCookie, {
				method: "PATCH",
				json: { status: "published" },
			})
			expect(updated.status).toBe("published")
		})

		it("owner can archive a published form", async () => {
			const updated = await api<{ status: string }>(`/api/forms/${formId}`, userCookie, {
				method: "PATCH",
				json: { status: "archived" },
			})
			expect(updated.status).toBe("archived")
		})

		it("owner can revert an archived form back to draft", async () => {
			const updated = await api<{ status: string }>(`/api/forms/${formId}`, userCookie, {
				method: "PATCH",
				json: { status: "draft" },
			})
			expect(updated.status).toBe("draft")
		})
	})

	describe("Form elements duplication", () => {
		it("duplicated form preserves elements with correct parent relationships", async () => {
			const form = await createForm(adminCookie, "[VITEST] form with elements to duplicate")

			// Add a section with a child element
			const saveResult = await api<{ mapping: Record<string, number> }>(
				`/api/forms/${form.id}/elements`,
				adminCookie,
				{
					method: "PUT",
					json: {
						elements: [
							{ tempId: "s1", type: "section", position: 1000, parentId: null, name: "section_1", config: {}, isRequired: false },
							{ tempId: "f1", type: "text", position: 1000, parentId: "s1", name: "field_1", config: {}, isRequired: false },
						],
					},
				},
			)

			const copy = await api<{ id: number }>(
				`/api/forms/${form.id}/duplicate`,
				adminCookie,
				{ method: "POST" },
			)
			createdFormIds.push(copy.id)

			// Get the duplicated form's elements
			const copyForm = await api<{ elements: Array<{ id: number; type: string; parentId: number | null }> }>(
				`/api/forms/${copy.id}`,
				adminCookie,
			)

			const section = copyForm.elements.find((el) => el.type === "section")
			const field = copyForm.elements.find((el) => el.type === "text")

			expect(section).toBeDefined()
			expect(field).toBeDefined()
			expect(field?.parentId).toBe(section?.id)
			// Verify element IDs are new (not from the original form)
			expect(section?.id).not.toBe(saveResult.mapping["s1"])
		})
	})
})
