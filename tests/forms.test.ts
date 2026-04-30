import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { login, api, apiRequest, ADMIN, USER, USER2 } from "./helpers/client"

let adminCookie: string
let userCookie: string
let user2Cookie: string

// IDs of forms created during tests — deleted in afterAll
const createdFormIds: number[] = []

beforeAll(async () => {
	;[adminCookie, userCookie, user2Cookie] = await Promise.all([
		login(ADMIN.email, ADMIN.password),
		login(USER.email, USER.password),
		login(USER2.email, USER2.password),
	])
})

afterAll(async () => {
	// Clean up all test forms with admin to avoid leftover data
	await Promise.all(
		createdFormIds.map((id) =>
			apiRequest(`/api/forms/${id}`, adminCookie, { method: "DELETE" }).catch(() => {}),
		),
	)
})

async function createForm(cookie: string, title: string): Promise<{ id: number; title: string }> {
	const form = await api<{ id: number; title: string }>("/api/forms", cookie, {
		method: "POST",
		json: { title, description: "vitest test form" },
	})
	createdFormIds.push(form.id)
	return form
}

describe("Form CRUD & ownership", () => {
	describe("Creating forms", () => {
		it("user can create a form", async () => {
			const form = await createForm(userCookie, "[VITEST] user creates form")
			expect(form.id).toBeTypeOf("number")
			expect(form.title).toBe("[VITEST] user creates form")
		})

		it("admin can create a form", async () => {
			const form = await createForm(adminCookie, "[VITEST] admin creates form")
			expect(form.id).toBeTypeOf("number")
		})

		it("unauthenticated cannot create a form → 401", async () => {
			const res = await fetch("http://localhost:3000/api/forms", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title: "should fail" }),
			})
			expect(res.status).toBe(401)
		})
	})

	describe("Listing forms", () => {
		let userFormId: number
		let adminFormId: number

		beforeAll(async () => {
			const [uf, af] = await Promise.all([
				createForm(userCookie, "[VITEST] user list test form"),
				createForm(adminCookie, "[VITEST] admin list test form"),
			])
			userFormId = uf.id
			adminFormId = af.id
		})

		it("user sees only their own forms (not admin's)", async () => {
			const forms = await api<Array<{ id: number; isOwner: boolean }>>("/api/forms", userCookie)
			const ids = forms.map((f) => f.id)
			expect(ids).toContain(userFormId)
			expect(ids).not.toContain(adminFormId)
		})

		it("admin sees all forms including user's", async () => {
			const forms = await api<Array<{ id: number }>>("/api/forms", adminCookie)
			const ids = forms.map((f) => f.id)
			expect(ids).toContain(userFormId)
			expect(ids).toContain(adminFormId)
		})

		it("each user form result has isOwner=true", async () => {
			const forms = await api<Array<{ id: number; isOwner: boolean }>>("/api/forms", userCookie)
			const ownForms = forms.filter((f) => f.id === userFormId)
			expect(ownForms[0]?.isOwner).toBe(true)
		})

		it("each form result includes a permissions object", async () => {
			const forms = await api<Array<{ permissions: Record<string, boolean> }>>(
				"/api/forms",
				userCookie,
			)
			expect(forms.length).toBeGreaterThan(0)
			const perm = forms[0]?.permissions
			expect(perm).toHaveProperty("canViewSubmissions")
			expect(perm).toHaveProperty("canEditForm")
		})
	})

	describe("Getting a single form", () => {
		let formId: number

		beforeAll(async () => {
			const form = await createForm(userCookie, "[VITEST] get single form test")
			formId = form.id
		})

		it("owner can GET their form with permissions object", async () => {
			const form = await api<{ id: number; permissions: Record<string, boolean> }>(
				`/api/forms/${formId}`,
				userCookie,
			)
			expect(form.id).toBe(formId)
			expect(form.permissions.canDelete).toBe(true)
			expect(form.permissions.canManageShares).toBe(true)
			expect(form.permissions.canEditForm).toBe(true)
		})

		it("admin can GET any form", async () => {
			const form = await api<{ id: number }>(`/api/forms/${formId}`, adminCookie)
			expect(form.id).toBe(formId)
		})

		it("user2 cannot GET a form they don't own and aren't shared to → 403", async () => {
			const res = await apiRequest(`/api/forms/${formId}`, user2Cookie)
			expect(res.status).toBe(403)
		})
	})

	describe("Patching a form", () => {
		let userFormId: number
		let user2FormId: number

		beforeAll(async () => {
			;[{ id: userFormId }, { id: user2FormId }] = await Promise.all([
				createForm(userCookie, "[VITEST] user patch source"),
				createForm(user2Cookie, "[VITEST] user2 owns this"),
			])
		})

		it("owner can PATCH their own form", async () => {
			const updated = await api<{ title: string }>(`/api/forms/${userFormId}`, userCookie, {
				method: "PATCH",
				json: { title: "[VITEST] user patch updated" },
			})
			expect(updated.title).toBe("[VITEST] user patch updated")
		})

		it("user cannot PATCH another user's form → 403", async () => {
			const res = await apiRequest(`/api/forms/${user2FormId}`, userCookie, {
				method: "PATCH",
				json: { title: "hacked" },
			})
			expect(res.status).toBe(403)
		})

		it("admin can PATCH any form", async () => {
			const updated = await api<{ title: string }>(`/api/forms/${user2FormId}`, adminCookie, {
				method: "PATCH",
				json: { title: "[VITEST] admin patched user2 form" },
			})
			expect(updated.title).toBe("[VITEST] admin patched user2 form")
		})
	})

	describe("Deleting a form", () => {
		it("owner can delete their own form", async () => {
			const { id } = await createForm(userCookie, "[VITEST] to be deleted by owner")
			const res = await apiRequest(`/api/forms/${id}`, userCookie, { method: "DELETE" })
			expect(res.status).toBe(200)
			// Already deleted — remove from cleanup list
			createdFormIds.splice(createdFormIds.indexOf(id), 1)
		})

		it("user cannot delete another user's form → 403", async () => {
			const { id } = await createForm(user2Cookie, "[VITEST] user2 owns, user tries to delete")
			const res = await apiRequest(`/api/forms/${id}`, userCookie, { method: "DELETE" })
			expect(res.status).toBe(403)
		})

		it("admin can delete any form", async () => {
			const { id } = await createForm(userCookie, "[VITEST] admin will delete this")
			const res = await apiRequest(`/api/forms/${id}`, adminCookie, { method: "DELETE" })
			expect(res.status).toBe(200)
			createdFormIds.splice(createdFormIds.indexOf(id), 1)
		})

		it("GET on deleted form returns 404", async () => {
			const { id } = await createForm(userCookie, "[VITEST] delete then 404")
			await apiRequest(`/api/forms/${id}`, adminCookie, { method: "DELETE" })
			createdFormIds.splice(createdFormIds.indexOf(id), 1)

			const res = await apiRequest(`/api/forms/${id}`, adminCookie)
			expect(res.status).toBe(404)
		})
	})
})
