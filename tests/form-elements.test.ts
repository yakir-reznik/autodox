import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { login, api, apiRequest, unauthRequest, ADMIN, USER, USER2 } from "./helpers/client"

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

async function createForm(cookie: string, title: string): Promise<{ id: number }> {
	const form = await api<{ id: number }>("/api/forms", cookie, {
		method: "POST",
		json: { title, description: "vitest elements test" },
	})
	createdFormIds.push(form.id)
	return form
}

describe("Form elements API", () => {
	describe("Saving elements", () => {
		let formId: number

		beforeAll(async () => {
			const form = await createForm(adminCookie, "[VITEST] elements save test")
			formId = form.id
		})

		it("saves a single element and returns tempId→realId mapping", async () => {
			const result = await api<{ elements: unknown[]; mapping: Record<string, number> }>(
				`/api/forms/${formId}/elements`,
				adminCookie,
				{
					method: "PUT",
					json: {
						elements: [
							{
								tempId: "temp-1",
								type: "text",
								position: 1000,
								parentId: null,
								name: "field_1",
								config: {},
								isRequired: false,
							},
						],
					},
				},
			)
			expect(result.mapping["temp-1"]).toBeTypeOf("number")
			expect(result.elements).toHaveLength(1)
		})

		it("saves a parent section and child element, mapping both tempIds", async () => {
			const result = await api<{ elements: Array<{ id: number; parentId: number | null }>; mapping: Record<string, number> }>(
				`/api/forms/${formId}/elements`,
				adminCookie,
				{
					method: "PUT",
					json: {
						elements: [
							{
								tempId: "parent-1",
								type: "section",
								position: 1000,
								parentId: null,
								name: "section_1",
								config: {},
								isRequired: false,
							},
							{
								tempId: "child-1",
								type: "text",
								position: 1000,
								parentId: "parent-1",
								name: "field_in_section",
								config: {},
								isRequired: false,
							},
						],
					},
				},
			)

			const parentRealId = result.mapping["parent-1"]
			const childRealId = result.mapping["child-1"]

			expect(parentRealId).toBeTypeOf("number")
			expect(childRealId).toBeTypeOf("number")

			const child = result.elements.find((el) => el.id === childRealId)
			expect(child?.parentId).toBe(parentRealId)
		})

		it("soft-deletes elements omitted from PUT payload", async () => {
			const setupForm = await createForm(adminCookie, "[VITEST] elements soft-delete test")
			const fid = setupForm.id

			// Save two elements
			const first = await api<{ mapping: Record<string, number> }>(
				`/api/forms/${fid}/elements`,
				adminCookie,
				{
					method: "PUT",
					json: {
						elements: [
							{ tempId: "keep", type: "text", position: 1000, parentId: null, name: "keep_me", config: {}, isRequired: false },
							{ tempId: "drop", type: "text", position: 2000, parentId: null, name: "drop_me", config: {}, isRequired: false },
						],
					},
				},
			)

			const keepId = first.mapping["keep"]
			const dropId = first.mapping["drop"]

			// PUT only the first element (omit the second — should soft-delete it)
			const second = await api<{ elements: Array<{ id: number }> }>(
				`/api/forms/${fid}/elements`,
				adminCookie,
				{
					method: "PUT",
					json: {
						elements: [
							{ id: keepId, type: "text", position: 1000, parentId: null, name: "keep_me", config: {}, isRequired: false },
						],
					},
				},
			)

			const ids = second.elements.map((el) => el.id)
			expect(ids).toContain(keepId)
			expect(ids).not.toContain(dropId)
		})
	})

	describe("Permission enforcement", () => {
		let formId: number
		let shareId: number

		beforeAll(async () => {
			const form = await createForm(userCookie, "[VITEST] elements permission test")
			formId = form.id
		})

		afterAll(async () => {
			if (shareId) {
				await apiRequest(`/api/forms/${formId}/shares/${shareId}`, userCookie, { method: "DELETE" }).catch(() => {})
			}
		})

		it("non-owner without share cannot PUT elements → 403", async () => {
			const res = await apiRequest(`/api/forms/${formId}/elements`, user2Cookie, {
				method: "PUT",
				json: { elements: [] },
			})
			expect(res.status).toBe(403)
		})

		it("unauthenticated cannot PUT elements → 401", async () => {
			const res = await unauthRequest(`/api/forms/${formId}/elements`, {
				method: "PUT",
				json: { elements: [] },
			})
			expect(res.status).toBe(401)
		})

		it("grantee without canEditForm cannot PUT elements → 403", async () => {
			const share = await api<{ id: number }>(`/api/forms/${formId}/shares`, userCookie, {
				method: "POST",
				json: {
					granteeEmail: USER2.email,
					canViewSubmissions: false,
					canCreateSubmissions: false,
					canManageSubmissions: false,
					canEditForm: false,
				},
			})
			shareId = share.id

			const res = await apiRequest(`/api/forms/${formId}/elements`, user2Cookie, {
				method: "PUT",
				json: { elements: [] },
			})
			expect(res.status).toBe(403)
		})

		it("grantee with canEditForm can PUT elements → 200", async () => {
			// Upgrade share to include canEditForm
			await apiRequest(`/api/forms/${formId}/shares/${shareId}`, userCookie, {
				method: "PATCH",
				json: { canEditForm: true },
			})

			const res = await apiRequest(`/api/forms/${formId}/elements`, user2Cookie, {
				method: "PUT",
				json: { elements: [] },
			})
			expect(res.status).toBe(200)
		})
	})
})
