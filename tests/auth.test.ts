import { describe, it, expect, beforeAll } from "vitest"
import { login, api, unauthRequest, ADMIN, USER } from "./helpers/client"

describe("Authentication & session roles", () => {
	describe("Admin login", () => {
		it("returns roles [admin, user] for admin account", async () => {
			const cookie = await login(ADMIN.email, ADMIN.password)
			expect(cookie).toBeTruthy()

			const session = await api<{ user: { roles: string[] } }>("/api/auth/session", cookie)
			expect(session.user.roles).toContain("admin")
			expect(session.user.roles).toContain("user")
			expect(session.user.roles).toHaveLength(2)
		})

		it("session includes id, email, name, apiKey", async () => {
			const cookie = await login(ADMIN.email, ADMIN.password)
			const session = await api<{ user: Record<string, unknown> }>("/api/auth/session", cookie)
			expect(session.user).toMatchObject({
				email: ADMIN.email,
				roles: expect.any(Array),
				apiKey: expect.any(String),
			})
			expect(typeof session.user.id).toBe("number")
		})
	})

	describe("User login", () => {
		it("returns roles [user] only for regular user", async () => {
			const cookie = await login(USER.email, USER.password)
			const session = await api<{ user: { roles: string[] } }>("/api/auth/session", cookie)
			expect(session.user.roles).toEqual(["user"])
			expect(session.user.roles).not.toContain("admin")
		})
	})

	describe("Invalid credentials", () => {
		it("returns 401 for wrong password", async () => {
			const res = await unauthRequest("/api/auth/login", {
				method: "POST",
				json: { email: ADMIN.email, password: "wrongpassword" },
			})
			expect(res.status).toBe(401)
		})

		it("returns 401 for unknown email", async () => {
			const res = await unauthRequest("/api/auth/login", {
				method: "POST",
				json: { email: "nobody@nowhere.test", password: "x" },
			})
			expect(res.status).toBe(401)
		})
	})

	describe("Unauthenticated access", () => {
		it("GET /api/auth/session returns no user when not logged in", async () => {
			const res = await unauthRequest("/api/auth/session")
			// nuxt-auth-utils returns 200 with empty session (no user key)
			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.user).toBeUndefined()
		})

		it("health endpoint is public", async () => {
			const res = await unauthRequest("/api/health")
			expect(res.status).toBe(200)
		})
	})
})
