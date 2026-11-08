import { requireRoles } from "~~/server/utils/authorization";
import { getThemes } from "~~/server/utils/themes";
export default defineEventHandler(async (event) => {
	await requireRoles(event, ["admin"]);
	return getThemes();
});
