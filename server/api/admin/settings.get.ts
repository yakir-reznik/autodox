import { getAppSettings } from "~~/server/utils/appSettings";
import { requireRoles } from "~~/server/utils/authorization";

export default defineEventHandler(async (event) => {
	await requireRoles(event, ["admin"]);

	return getAppSettings();
});
