import { formSharesTable } from "~~/server/db/schema";
import { requireFormPermission } from "~~/server/utils/authorization";
import type { FormSharePermissions } from "~~/app/types/form-builder";
import { db } from "~~/server/db";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function shareResponse(email: string) {
	return {
		success: true,
		message: `הטופס שותף עם ${email}`,
	};
}

export default defineEventHandler(async (event) => {
	const formId = Number(getRouterParam(event, "id"));
	const { session } = await requireFormPermission(event, formId, "manage_shares");

	const body = await readBody<{ granteeEmail: string; permissions: FormSharePermissions }>(
		event,
	);
	const granteeEmail = body.granteeEmail?.trim().toLowerCase();

	if (!granteeEmail || !emailPattern.test(granteeEmail) || !body.permissions) {
		throw createError({
			statusCode: 400,
			message: "כתובת אימייל והרשאות הן שדות חובה",
		});
	}

	try {
		await db.insert(formSharesTable).values({
			formId,
			granteeEmail,
			grantedBy: session.user.id,
			canViewSubmissions: body.permissions.canViewSubmissions,
			canCreateSubmissions: body.permissions.canCreateSubmissions,
			canManageSubmissions: body.permissions.canManageSubmissions,
			canEditForm: body.permissions.canEditForm,
		});
	} catch (err: any) {
		const isDuplicate =
			err?.code === "ER_DUP_ENTRY" ||
			err?.cause?.code === "ER_DUP_ENTRY" ||
			err?.errno === 1062 ||
			err?.cause?.errno === 1062;
		if (isDuplicate) {
			return shareResponse(granteeEmail);
		}
		throw err;
	}

	return shareResponse(granteeEmail);
});
