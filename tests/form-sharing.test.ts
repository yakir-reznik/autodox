import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { login, api, apiRequest, unauthRequest, ADMIN, USER, USER2 } from "./helpers/client"

let adminCookie: string
let userCookie: string
let user2Cookie: string

let user2Id: number

// All test forms cleaned up in afterAll
const createdFormIds: number[] = []

beforeAll(async () => {
	;[adminCookie, userCookie, user2Cookie] = await Promise.all([
		login(ADMIN.email, ADMIN.password),
		login(USER.email, USER.password),
		login(USER2.email, USER2.password),
	])

	// Resolve user2's id via user search (admin searches for them)
	const results = await api<Array<{ id: number; email: string }>>(
		"/api/users/search?q=vitest-user2",
		adminCookie,
	)
	const found = results.find((u) => u.email === USER2.email)
	if (!found) throw new Error("vitest-user2 not found — did you run the setup commands?")
	user2Id = found.id
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
		json: { title, description: "vitest sharing test" },
	})
	createdFormIds.push(form.id)
	return form
}

async function createShare(
	formId: number,
	ownerCookie: string,
	options: {
		granteeUserId: number
		canViewSubmissions?: boolean
		canCreateSubmissions?: boolean
		canManageSubmissions?: boolean
		canEditForm?: boolean
	},
) {
	return api<{ id: number; granteeUserId: number; permissions: Record<string, boolean> }>(
		`/api/forms/${formId}/shares`,
		ownerCookie,
		{
			method: "POST",
			json: {
				granteeUserId: options.granteeUserId,
				permissions: {
					canViewSubmissions: options.canViewSubmissions ?? false,
					canCreateSubmissions: options.canCreateSubmissions ?? false,
					canManageSubmissions: options.canManageSubmissions ?? false,
					canEditForm: options.canEditForm ?? false,
				},
			},
		},
	)
}

describe("Form sharing — share CRUD", () => {
	let formId: number

	beforeAll(async () => {
		const form = await createForm(userCookie, "[VITEST] share CRUD test form")
		formId = form.id
	})

	it("owner can create a share", async () => {
		const share = await createShare(formId, userCookie, {
			granteeUserId: user2Id,
			canViewSubmissions: true,
		})
		expect(share.id).toBeTypeOf("number")
		expect(share.granteeUserId).toBe(user2Id)
		expect(share.permissions.canViewSubmissions).toBe(true)
		expect(share.permissions.canEditForm).toBe(false)
	})

	it("creating a duplicate share → 409", async () => {
		// Share already exists from the previous test
		const res = await apiRequest(`/api/forms/${formId}/shares`, userCookie, {
			method: "POST",
			json: {
				granteeUserId: user2Id,
				permissions: {
					canViewSubmissions: false,
					canCreateSubmissions: false,
					canManageSubmissions: false,
					canEditForm: false,
				},
			},
		})
		expect(res.status).toBe(409)
	})

	it("owner can list shares", async () => {
		const shares = await api<Array<{ granteeUserId: number }>>(`/api/forms/${formId}/shares`, userCookie)
		const match = shares.find((s) => s.granteeUserId === user2Id)
		expect(match).toBeDefined()
	})

	it("owner can update share permissions", async () => {
		const shares = await api<Array<{ id: number }>>(`/api/forms/${formId}/shares`, userCookie)
		const shareId = shares[0]?.id
		expect(shareId).toBeDefined()

		const res = await apiRequest(`/api/forms/${formId}/shares/${shareId}`, userCookie, {
			method: "PATCH",
			json: {
				permissions: {
					canViewSubmissions: true,
					canCreateSubmissions: true,
					canManageSubmissions: false,
					canEditForm: false,
				},
			},
		})
		expect(res.status).toBe(200)
	})

	it("owner can delete a share", async () => {
		const shares = await api<Array<{ id: number }>>(`/api/forms/${formId}/shares`, userCookie)
		const shareId = shares[0]?.id

		const res = await apiRequest(`/api/forms/${formId}/shares/${shareId}`, userCookie, {
			method: "DELETE",
		})
		expect(res.status).toBe(200)

		const remaining = await api<Array<{ id: number }>>(`/api/forms/${formId}/shares`, userCookie)
		expect(remaining.find((s) => s.id === shareId)).toBeUndefined()
	})
})

describe("Form sharing — validation rules", () => {
	let formId: number
	let user2FormId: number

	beforeAll(async () => {
		;[{ id: formId }, { id: user2FormId }] = await Promise.all([
			createForm(userCookie, "[VITEST] validation rules form"),
			createForm(user2Cookie, "[VITEST] user2 validation form"),
		])
	})

	it("cannot share with the form owner themselves → 400", async () => {
		// user is the owner of formId; try to share with themselves
		// First we need user's own ID — get from session
		const session = await api<{ user: { id: number } }>("/api/auth/session", userCookie)
		const userId = session.user.id

		const res = await apiRequest(`/api/forms/${formId}/shares`, userCookie, {
			method: "POST",
			json: {
				granteeUserId: userId,
				permissions: {
					canViewSubmissions: true,
					canCreateSubmissions: false,
					canManageSubmissions: false,
					canEditForm: false,
				},
			},
		})
		expect(res.status).toBe(400)
	})

	it("non-owner cannot create a share → 403", async () => {
		const res = await apiRequest(`/api/forms/${formId}/shares`, user2Cookie, {
			method: "POST",
			json: {
				granteeUserId: user2Id,
				permissions: {
					canViewSubmissions: true,
					canCreateSubmissions: false,
					canManageSubmissions: false,
					canEditForm: false,
				},
			},
		})
		expect(res.status).toBe(403)
	})

	it("non-owner cannot list shares → 403", async () => {
		const res = await apiRequest(`/api/forms/${formId}/shares`, user2Cookie)
		expect(res.status).toBe(403)
	})

	it("unauthenticated cannot manage shares → 401", async () => {
		const res = await unauthRequest(`/api/forms/${formId}/shares`)
		expect(res.status).toBe(401)
	})
})

describe("Form sharing — permission enforcement for grantee", () => {
	let formId: number
	let shareId: number

	beforeAll(async () => {
		const form = await createForm(userCookie, "[VITEST] permission enforcement form")
		formId = form.id

		// Share with user2: view only (no edit_form, no manage_shares)
		const share = await createShare(formId, userCookie, {
			granteeUserId: user2Id,
			canViewSubmissions: true,
			canEditForm: false,
		})
		shareId = share.id
	})

	it("grantee sees the shared form in their form list", async () => {
		const forms = await api<Array<{ id: number; isOwner: boolean }>>("/api/forms", user2Cookie)
		const found = forms.find((f) => f.id === formId)
		expect(found).toBeDefined()
		expect(found?.isOwner).toBe(false)
	})

	it("grantee's list entry reflects correct permissions", async () => {
		const forms = await api<
			Array<{ id: number; permissions: Record<string, boolean> }>
		>("/api/forms", user2Cookie)
		const found = forms.find((f) => f.id === formId)
		expect(found?.permissions.canViewSubmissions).toBe(true)
		expect(found?.permissions.canEditForm).toBe(false)
	})

	it("grantee can GET the shared form", async () => {
		const form = await api<{ id: number; permissions: Record<string, boolean> }>(
			`/api/forms/${formId}`,
			user2Cookie,
		)
		expect(form.id).toBe(formId)
		expect(form.permissions.canDelete).toBe(false)
		expect(form.permissions.canManageShares).toBe(false)
		expect(form.permissions.canViewSubmissions).toBe(true)
	})

	it("grantee without edit_form cannot PATCH the form → 403", async () => {
		const res = await apiRequest(`/api/forms/${formId}`, user2Cookie, {
			method: "PATCH",
			json: { title: "[VITEST] grantee tried to edit" },
		})
		expect(res.status).toBe(403)
	})

	it("grantee cannot DELETE the form → 403", async () => {
		const res = await apiRequest(`/api/forms/${formId}`, user2Cookie, { method: "DELETE" })
		expect(res.status).toBe(403)
	})

	it("grantee cannot manage shares → 403", async () => {
		const res = await apiRequest(`/api/forms/${formId}/shares`, user2Cookie)
		expect(res.status).toBe(403)
	})

	describe("after upgrading share to include edit_form", () => {
		beforeAll(async () => {
			await apiRequest(`/api/forms/${formId}/shares/${shareId}`, userCookie, {
				method: "PATCH",
				json: {
					permissions: {
						canViewSubmissions: true,
						canCreateSubmissions: false,
						canManageSubmissions: false,
						canEditForm: true,
					},
				},
			})
		})

		it("grantee can now PATCH the form", async () => {
			const res = await apiRequest(`/api/forms/${formId}`, user2Cookie, {
				method: "PATCH",
				json: { title: "[VITEST] grantee with edit_form patched" },
			})
			expect(res.status).toBe(200)
		})

		it("grantee still cannot DELETE even with edit_form → 403", async () => {
			const res = await apiRequest(`/api/forms/${formId}`, user2Cookie, { method: "DELETE" })
			expect(res.status).toBe(403)
		})

		it("grantee still cannot manage shares even with edit_form → 403", async () => {
			const res = await apiRequest(`/api/forms/${formId}/shares`, user2Cookie)
			expect(res.status).toBe(403)
		})
	})

	describe("after revoking the share", () => {
		beforeAll(async () => {
			await apiRequest(`/api/forms/${formId}/shares/${shareId}`, userCookie, {
				method: "DELETE",
			})
		})

		it("grantee no longer sees the form in their list", async () => {
			const forms = await api<Array<{ id: number }>>("/api/forms", user2Cookie)
			const found = forms.find((f) => f.id === formId)
			expect(found).toBeUndefined()
		})

		it("grantee cannot GET the form → 403", async () => {
			const res = await apiRequest(`/api/forms/${formId}`, user2Cookie)
			expect(res.status).toBe(403)
		})
	})
})

describe("Form sharing — admin bypass", () => {
	let formId: number

	beforeAll(async () => {
		const form = await createForm(userCookie, "[VITEST] admin bypass test form")
		formId = form.id
	})

	it("admin can GET any form without a share record", async () => {
		const res = await apiRequest(`/api/forms/${formId}`, adminCookie)
		expect(res.status).toBe(200)
	})

	it("admin can list shares for any form", async () => {
		const res = await apiRequest(`/api/forms/${formId}/shares`, adminCookie)
		expect(res.status).toBe(200)
	})

	it("admin can PATCH any form", async () => {
		const res = await apiRequest(`/api/forms/${formId}`, adminCookie, {
			method: "PATCH",
			json: { title: "[VITEST] admin bypassed ownership" },
		})
		expect(res.status).toBe(200)
	})
})
