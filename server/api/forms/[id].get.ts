import { db } from "~~/server/db";
import { formsTable, formElementsTable, submissionsTable } from "~~/server/db/schema";
import { eq, asc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const id = Number(getRouterParam(event, "id"));

	if (isNaN(id)) {
		throw createError({
			statusCode: 400,
			message: "Invalid form ID",
		});
	}

	// Check for token in query params
	const token = getQuery(event).token as string | undefined;

	const form = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, id),
		with: {
			folder: true,
			elements: {
				where: eq(formElementsTable.isDeleted, false),
				orderBy: [asc(formElementsTable.position)],
			},
		},
	});

	if (!form) {
		throw createError({
			statusCode: 404,
			message: "Form not found",
		});
	}

	// If token is provided, fetch submission data for prefill
	let prefillData = null;
	let submissionStatus = null;
	let isLocked = false;
	let submission = null;

	if (token) {
		submission = await db.query.submissionsTable.findFirst({
			where: eq(submissionsTable.token, token),
		});

		if (submission && submission.formId === id) {
			// Check if token is expired
			if (new Date() > new Date(submission.expiresAt)) {
				throw createError({
					statusCode: 410,
					message: "Submission link has expired",
				});
			}

			submissionStatus = submission.status;
			isLocked = submission.status === "locked";

			// If already submitted/locked, use submission data instead of prefill
			if (isLocked && submission.submissionData) {
				prefillData = submission.submissionData;
			} else {
				prefillData = submission.prefillData;
			}
		}
	}

	// Determine password requirement (submission password > form password)
	const effectivePassword = submission?.password ?? form.password;
	const hasPassword = !!effectivePassword;

	// Check if password has been verified via cookie
	const cookieName = token ? `form_pwd_${token}` : `form_pwd_${id}`;
	const verifiedCookie = getCookie(event, cookieName);
	const isPasswordVerified = verifiedCookie === "verified";

	// If password required and not verified, return limited response
	if (hasPassword && !isPasswordVerified) {
		return {
			id: form.id,
			title: form.title,
			hasPassword: true,
			requiresPassword: true,
		};
	}

	// Remove password from form object before returning (never expose password)
	const { password: _password, ...formWithoutPassword } = form;

	return {
		...formWithoutPassword,
		hasPassword,
		prefillData,
		submissionStatus,
		isLocked,
	};
});
