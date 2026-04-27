import { db } from "~~/server/db";
import { formsTable, formElementsTable, submissionsTable } from "~~/server/db/schema";
import { eq, asc } from "drizzle-orm";
import { getFormPermissions } from "~~/server/utils/authorization";

export default defineEventHandler(async (event) => {
	const id = Number(getRouterParam(event, "id"));

	if (isNaN(id)) {
		throw createError({
			statusCode: 400,
			message: "Invalid form ID",
		});
	}

	const token = getQuery(event).token as string | undefined;

	// Management/authenticated fetch path: session exists, no submission token
	if (!token) {
		const { user } = await getUserSession(event);
		if (user) {
			const isAdmin = user.roles.includes("admin");

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
				throw createError({ statusCode: 404, message: "Form not found" });
			}

			const permissions = await getFormPermissions(user.id, id, isAdmin);
			if (!permissions.has("view")) {
				throw createError({ statusCode: 403, message: "Forbidden" });
			}

			const { password: _password, ...formWithoutPassword } = form;
			return {
				...formWithoutPassword,
				hasPassword: !!form.password,
				permissions: {
					canView: permissions.has("view"),
					canViewSubmissions: permissions.has("view_submissions"),
					canCreateSubmissions: permissions.has("create_submissions"),
					canManageSubmissions: permissions.has("manage_submissions"),
					canEditForm: permissions.has("edit_form"),
					canDelete: permissions.has("delete"),
					canManageShares: permissions.has("manage_shares"),
				},
			};
		}
	}

	// Public form fill path (token provided or no session)
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

	const hasValidToken = !!token;

	if (!form.allowPublicSubmissions && !hasValidToken) {
		return {
			id: form.id,
			title: form.title,
			description: form.description,
			requiresToken: true,
		};
	}

	let prefillData = null;
	let submissionStatus = null;
	let isLocked = false;
	let isArchived = false;
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

			submissionStatus = submission.status;
			isLocked = submission.status === "locked";
			isArchived = submission.isArchived;

			if (isLocked && submission.submissionData) {
				prefillData = submission.submissionData;
			} else {
				prefillData = submission.prefillData;
			}
		}
	}

	const { password: effectivePassword } = resolveFormSettings(form, submission);
	const hasPassword = !!effectivePassword;

	const cookieName = token ? `form_pwd_${token}` : `form_pwd_${id}`;
	const verifiedCookie = getCookie(event, cookieName);
	const isPasswordVerified = verifiedCookie === "verified";

	if (hasPassword && !isPasswordVerified) {
		return {
			id: form.id,
			title: form.title,
			hasPassword: true,
			requiresPassword: true,
		};
	}

	const { password: _password, ...formWithoutPassword } = form;

	return {
		...formWithoutPassword,
		hasPassword,
		prefillData,
		submissionStatus,
		isLocked,
		isArchived,
	};
});
