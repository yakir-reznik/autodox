import {
	appSettingDefaults,
	getAppSettings,
	updateAppSettings,
} from "~~/server/utils/appSettings";
import { requireRoles } from "~~/server/utils/authorization";
import {
	aiFormImportModelValues,
	type AppSettings,
} from "~~/shared/types/app-settings";

type AppSettingsBody = Partial<AppSettings>;

export default defineEventHandler(async (event) => {
	const session = await requireRoles(event, ["admin"]);
	const currentSettings = await getAppSettings();
	const body = await readBody<AppSettingsBody>(event);
	const nextSettings = parseSettings(body, currentSettings);

	await updateAppSettings(nextSettings, session.user.id);

	return nextSettings;
});

function parseSettings(body: AppSettingsBody, currentSettings: AppSettings): AppSettings {
	const aiFormImportModel = body.aiFormImportModel?.trim() || currentSettings.aiFormImportModel;
	const aiFormImportMaxFileSizeMb = Number(
		body.aiFormImportMaxFileSizeMb ?? currentSettings.aiFormImportMaxFileSizeMb,
	);

	if (!aiFormImportModel) {
		throw createError({ statusCode: 400, message: "AI model is required" });
	}

	if (!aiFormImportModelValues.includes(aiFormImportModel as any)) {
		throw createError({ statusCode: 400, message: "AI model is not supported" });
	}

	if (
		!Number.isFinite(aiFormImportMaxFileSizeMb)
		|| aiFormImportMaxFileSizeMb < 1
		|| aiFormImportMaxFileSizeMb > 100
	) {
		throw createError({
			statusCode: 400,
			message: `Max upload size must be between 1 and 100 MB. Default is ${appSettingDefaults.aiFormImportMaxFileSizeMb} MB.`,
		});
	}

	return {
		aiFormImportModel,
		aiFormImportMaxFileSizeMb,
	};
}
