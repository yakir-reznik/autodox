import { requireRoles } from "~~/server/utils/authorization";
import { aiFormImportPrompt } from "~~/server/utils/aiFormImport";

export default defineEventHandler(async (event) => {
	await requireRoles(event, ["admin"]);

	return { prompt: aiFormImportPrompt };
});
