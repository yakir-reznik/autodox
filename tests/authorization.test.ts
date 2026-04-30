import { describe, it, expect, beforeAll } from "vitest"
import { login, unauthRequest, apiRequest, ADMIN, USER } from "./helpers/client"

let adminCookie: string
let userCookie: string

beforeAll(async () => {
	adminCookie = await login(ADMIN.email, ADMIN.password)
	userCookie = await login(USER.email, USER.password)
})

describe("Role-based access control", () => {
	describe("Unauthenticated requests", () => {
		const protectedEndpoints = [
			{ method: "GET", path: "/api/forms" },
			{ method: "POST", path: "/api/forms" },
			{ method: "GET", path: "/api/folders" },
			{ method: "POST", path: "/api/folders" },
			{ method: "GET", path: "/api/user/profile" },
			{ method: "GET", path: "/api/admin/reports/external-ids" },
		]

		for (const { method, path } of protectedEndpoints) {
			it(`${method} ${path} → 401`, async () => {
				const res = await unauthRequest(path, { method })
				expect(res.status).toBe(401)
			})
		}
	})

	describe("Admin-only endpoints", () => {
		it("GET /api/admin/reports/external-ids → 200 for admin", async () => {
			const res = await apiRequest("/api/admin/reports/external-ids", adminCookie)
			expect(res.status).toBe(200)
		})

		it("GET /api/admin/reports/external-ids → 403 for regular user", async () => {
			const res = await apiRequest("/api/admin/reports/external-ids", userCookie)
			expect(res.status).toBe(403)
		})

		it("GET /api/admin/reports/submissions-by-external-id → 200 for admin", async () => {
			const res = await apiRequest(
				"/api/admin/reports/submissions-by-external-id?externalId=test",
				adminCookie,
			)
			// 200 or 404 are both valid (no data); 403 is not acceptable
			expect(res.status).not.toBe(403)
			expect(res.status).not.toBe(401)
		})

		it("GET /api/admin/reports/submissions-by-external-id → 403 for regular user", async () => {
			const res = await apiRequest(
				"/api/admin/reports/submissions-by-external-id?externalId=test",
				userCookie,
			)
			expect(res.status).toBe(403)
		})
	})

	describe("User-or-admin endpoints accessible to both", () => {
		it("GET /api/forms → 200 for admin", async () => {
			const res = await apiRequest("/api/forms", adminCookie)
			expect(res.status).toBe(200)
		})

		it("GET /api/forms → 200 for user", async () => {
			const res = await apiRequest("/api/forms", userCookie)
			expect(res.status).toBe(200)
		})

		it("GET /api/folders → 200 for admin", async () => {
			const res = await apiRequest("/api/folders", adminCookie)
			expect(res.status).toBe(200)
		})

		it("GET /api/folders → 200 for user", async () => {
			const res = await apiRequest("/api/folders", userCookie)
			expect(res.status).toBe(200)
		})

		it("GET /api/users/search → 200 for user", async () => {
			const res = await apiRequest("/api/users/search?q=vitest", userCookie)
			expect(res.status).toBe(200)
		})

		it("GET /api/users/search → 401 for unauthenticated", async () => {
			const res = await unauthRequest("/api/users/search?q=vitest")
			expect(res.status).toBe(401)
		})
	})
})
