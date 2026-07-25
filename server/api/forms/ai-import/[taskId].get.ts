import { requireRoles } from "~~/server/utils/authorization";
import { getAiFormImportTask } from "~~/server/utils/aiFormImportQueue";

export default defineEventHandler(async (event) => {
	const session = await requireRoles(event, ["admin"]);
	const taskId = getRouterParam(event, "taskId");

	if (!taskId) {
		throw createError({ statusCode: 400, message: "Task ID is required" });
	}

	const task = getAiFormImportTask(taskId, session.user.id);
	if (!task) {
		throw createError({ statusCode: 404, message: "AI import task not found" });
	}

	return task;
});
