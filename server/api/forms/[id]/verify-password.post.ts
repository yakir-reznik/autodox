import { db } from "~~/server/db";
import { formsTable, submissionsTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const id = Number(getRouterParam(event, "id"));
	if (isNaN(id)) {
		throw createError({
			statusCode: 400,
			message: "Invalid form ID",
		});
	}

	const body = await readBody(event);
	const { token, password } = body;

	if (!password) {
		throw createError({
			statusCode: 400,
			message: "Password is required",
		});
	}

	// Fetch the form
	const form = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, id),
	});

	if (!form) {
		throw createError({
			statusCode: 404,
			message: "Form not found",
		});
	}

	// Fetch submission if token provided
	let submission = null;

	if (token) {
		submission = await db.query.submissionsTable.findFirst({
			where: eq(submissionsTable.token, token),
		});

		if (submission && submission.formId === id) {
			if (new Date() > new Date(submission.expiresAt)) {
				throw createError({
					statusCode: 410,
					message: "Submission link has expired",
				});
			}
		}
	}

	// Determine effective password (submission override > form default)
	const { password: effectivePassword } = resolveFormSettings(form, submission);

	// If no password protection exists
	if (!effectivePassword) {
		throw createError({
			statusCode: 400,
			message: "This form does not require a password",
		});
	}

	// Plain text password comparison
	if (password !== effectivePassword) {
		throw createError({
			statusCode: 401,
			message: "Invalid password",
		});
	}

	// Set verification cookie
	const cookieName = token ? `form_pwd_${token}` : `form_pwd_${id}`;
	setCookie(event, cookieName, "verified", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 60 * 24, // 24 hours
		path: "/",
	});

	return {
		success: true,
	};
});
