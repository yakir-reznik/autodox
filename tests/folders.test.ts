import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { login, api, apiRequest, unauthRequest, ADMIN, USER, USER2 } from "./helpers/client"

let adminCookie: string
let userCookie: string
let user2Cookie: string

const createdFolderIds: number[] = []
const createdFormIds: number[] = []

beforeAll(async () => {
	;[adminCookie, userCookie, user2Cookie] = await Promise.all([
		login(ADMIN.email, ADMIN.password),
		login(USER.email, USER.password),
		login(USER2.email, USER2.password),
	])
})

afterAll(async () => {
	await Promise.all([
		...createdFormIds.map((id) =>
			apiRequest(`/api/forms/${id}`, adminCookie, { method: "DELETE" }).catch(() => {}),
		),
		...createdFolderIds.map((id) =>
			apiRequest(`/api/folders/${id}`, adminCookie, { method: "DELETE" }).catch(() => {}),
		),
	])
})

async function createFolder(cookie: string, name: string): Promise<{ id: number; name: string }> {
	const folder = await api<{ id: number; name: string }>("/api/folders", cookie, {
		method: "POST",
		json: { name },
	})
	createdFolderIds.push(folder.id)
	return folder
}

describe("Folders", () => {
	describe("CRUD", () => {
		let folderId: number

		it("user can create a folder", async () => {
			const folder = await createFolder(userCookie, "[VITEST] user folder")
			folderId = folder.id
			expect(folder.id).toBeTypeOf("number")
			expect(folder.name).toBe("[VITEST] user folder")
		})

		it("GET /api/folders includes the created folder for the owner", async () => {
			const folders = await api<Array<{ id: number }>>("/api/folders", userCookie)
			expect(folders.map((f) => f.id)).toContain(folderId)
		})

		it("admin sees all folders including user's", async () => {
			const folders = await api<Array<{ id: number }>>("/api/folders", adminCookie)
			expect(folders.map((f) => f.id)).toContain(folderId)
		})

		it("user2 does not see user's folder in their list", async () => {
			const folders = await api<Array<{ id: number }>>("/api/folders", user2Cookie)
			expect(folders.map((f) => f.id)).not.toContain(folderId)
		})

		it("owner can rename (PATCH) the folder", async () => {
			const updated = await api<{ name: string }>(`/api/folders/${folderId}`, userCookie, {
				method: "PATCH",
				json: { name: "[VITEST] renamed folder" },
			})
			expect(updated.name).toBe("[VITEST] renamed folder")
		})

		it("DELETE removes the folder; it no longer appears in GET", async () => {
			const res = await apiRequest(`/api/folders/${folderId}`, userCookie, { method: "DELETE" })
			expect(res.status).toBe(200)
			createdFolderIds.splice(createdFolderIds.indexOf(folderId), 1)

			const folders = await api<Array<{ id: number }>>("/api/folders", userCookie)
			expect(folders.map((f) => f.id)).not.toContain(folderId)
		})
	})

	describe("Auth guards", () => {
		it("unauthenticated POST → 401", async () => {
			const res = await unauthRequest("/api/folders", {
				method: "POST",
				json: { name: "should fail" },
			})
			expect(res.status).toBe(401)
		})

		it("unauthenticated GET → 401", async () => {
			const res = await unauthRequest("/api/folders")
			expect(res.status).toBe(401)
		})

		it("user cannot delete another user's folder → 403", async () => {
			const user2Folder = await createFolder(user2Cookie, "[VITEST] user2 folder")

			const res = await apiRequest(`/api/folders/${user2Folder.id}`, userCookie, { method: "DELETE" })
			expect(res.status).toBe(403)
		})

		it("admin can delete any user's folder", async () => {
			const userFolder = await createFolder(userCookie, "[VITEST] folder admin deletes")

			const res = await apiRequest(`/api/folders/${userFolder.id}`, adminCookie, { method: "DELETE" })
			expect(res.status).toBe(200)
			createdFolderIds.splice(createdFolderIds.indexOf(userFolder.id), 1)
		})
	})

	describe("Folder-based form filtering", () => {
		let folderId: number
		let formInFolderId: number
		let formOutsideId: number

		beforeAll(async () => {
			const folder = await createFolder(userCookie, "[VITEST] filter folder")
			folderId = folder.id

			const [inFolder, outside] = await Promise.all([
				api<{ id: number }>("/api/forms", userCookie, {
					method: "POST",
					json: { title: "[VITEST] form in folder", folderId },
				}),
				api<{ id: number }>("/api/forms", userCookie, {
					method: "POST",
					json: { title: "[VITEST] form outside folder" },
				}),
			])
			formInFolderId = inFolder.id
			formOutsideId = outside.id
			createdFormIds.push(formInFolderId, formOutsideId)
		})

		it("GET /api/forms?folderId=X returns only forms in that folder", async () => {
			const forms = await api<Array<{ id: number }>>(`/api/forms?folderId=${folderId}`, userCookie)
			const ids = forms.map((f) => f.id)
			expect(ids).toContain(formInFolderId)
			expect(ids).not.toContain(formOutsideId)
		})
	})
})
