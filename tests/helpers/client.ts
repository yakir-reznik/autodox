const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000"

export type Cookie = string

/** Login and return the raw Set-Cookie header value to use as a session cookie. */
export async function login(email: string, password: string): Promise<Cookie> {
	const res = await fetch(`${BASE_URL}/api/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	})
	if (!res.ok) {
		const body = await res.text()
		throw new Error(`Login failed (${res.status}): ${body}`)
	}
	return res.headers.get("set-cookie") ?? ""
}

interface RequestOptions extends RequestInit {
	/** Serialised as JSON body */
	json?: unknown
	/** x-api-key header value (replaces cookie auth) */
	apiKey?: string
}

/** Make an authenticated API request, returning the raw Response. */
export async function apiRequest(
	path: string,
	cookie: Cookie,
	options: RequestOptions = {},
): Promise<Response> {
	const { json, apiKey, ...rest } = options
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(rest.headers as Record<string, string>),
	}
	if (apiKey) {
		headers["x-api-key"] = apiKey
	} else if (cookie) {
		headers["Cookie"] = cookie
	}
	return fetch(`${BASE_URL}${path}`, {
		...rest,
		headers,
		body: json !== undefined ? JSON.stringify(json) : rest.body,
	})
}

/** Make an authenticated API request, parse JSON, throw on non-2xx. */
export async function api<T = unknown>(
	path: string,
	cookie: Cookie,
	options: RequestOptions = {},
): Promise<T> {
	const res = await apiRequest(path, cookie, options)
	if (!res.ok) {
		const data = await res.json().catch(() => ({}))
		const err = Object.assign(
			new Error(`${options.method ?? "GET"} ${path} → ${res.status}`),
			{ status: res.status, data },
		)
		throw err
	}
	return res.json()
}

/** Make an unauthenticated request; always returns the Response for status inspection. */
export async function unauthRequest(path: string, options: RequestOptions = {}): Promise<Response> {
	return apiRequest(path, "", options)
}

export const ADMIN = {
	email: "vitest-admin@autodox.test",
	password: "vitest123",
}

export const USER = {
	email: "vitest-user@autodox.test",
	password: "vitest123",
}

export const USER2 = {
	email: "vitest-user2@autodox.test",
	password: "vitest123",
}
