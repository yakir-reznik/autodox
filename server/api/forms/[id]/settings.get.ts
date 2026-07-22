import { requireFormPermission } from "~~/server/utils/authorization";

export default defineEventHandler(async (event) => {
	const id = Number(getRouterParam(event, "id"));
	if (isNaN(id)) {
		throw createError({
			statusCode: 400,
			message: "Invalid form ID",
		});
	}

	const { form, permissions } = await requireFormPermission(event, id, "edit_form");

	// Return form settings including plain text password
	return {
		id: form.id,
		title: form.title,
		description: form.description,
		status: form.status,
		theme: form.theme,
		webhookUrl: form.webhookUrl,
		webhookIncludePdf: form.webhookIncludePdf,
		allowPdfDownload: form.allowPdfDownload,
		password: form.password,
		allowPublicSubmissions: form.allowPublicSubmissions,
		createdBy: form.createdBy,
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
});
