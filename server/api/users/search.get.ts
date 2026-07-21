import { requireRoles } from "~~/server/utils/authorization";

export default defineEventHandler(async (event) => {
	await requireRoles(event, ["user"]);
	return [];
});
