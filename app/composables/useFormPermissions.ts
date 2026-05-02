import type { FormPermissionName, FormPermissions } from "~/types/form-builder";

const FORM_PERMISSION_FLAG_BY_NAME: Record<FormPermissionName, keyof FormPermissions> = {
	view: "canView",
	view_submissions: "canViewSubmissions",
	create_submissions: "canCreateSubmissions",
	manage_submissions: "canManageSubmissions",
	edit_form: "canEditForm",
	delete: "canDelete",
	manage_shares: "canManageShares",
};

export function hasFormPermission(
	permissions: FormPermissions | null | undefined,
	permission: FormPermissionName,
) {
	if (!permissions) return false;
	return permissions[FORM_PERMISSION_FLAG_BY_NAME[permission]];
}

export function hasRequiredFormPermissions(
	permissions: FormPermissions | null | undefined,
	requiredPermissions: FormPermissionName[],
	mode: "all" | "any" = "all",
) {
	if (!requiredPermissions.length) return true;

	return mode === "all"
		? requiredPermissions.every((permission) =>
				hasFormPermission(permissions, permission),
			)
		: requiredPermissions.some((permission) =>
				hasFormPermission(permissions, permission),
			);
}
