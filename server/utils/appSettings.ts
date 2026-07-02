import { eq, inArray } from "drizzle-orm";
import { db } from "~~/server/db";
import { appSettingsTable } from "~~/server/db/schema";
import type { AppSettings } from "~~/shared/types/app-settings";

export const appSettingDefaults = {
	aiFormImportModel: "google/gemini-2.5-flash-lite",
	aiFormImportMaxFileSizeMb: 10,
} satisfies AppSettings;

export type AppSettingKey = keyof AppSettings;

const appSettingKeys = Object.keys(appSettingDefaults) as AppSettingKey[];

export async function getAppSettings(): Promise<AppSettings> {
	const rows = await db.query.appSettingsTable.findMany({
		where: inArray(appSettingsTable.key, appSettingKeys),
	});

	const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));

	return {
		aiFormImportModel: parseStringSetting(
			values.aiFormImportModel,
			appSettingDefaults.aiFormImportModel,
		),
		aiFormImportMaxFileSizeMb: parseNumberSetting(
			values.aiFormImportMaxFileSizeMb,
			appSettingDefaults.aiFormImportMaxFileSizeMb,
		),
	};
}

export async function updateAppSettings(settings: AppSettings, updatedBy: number) {
	await Promise.all(
		appSettingKeys.map(async (key) => {
			const result = await db
				.update(appSettingsTable)
				.set({ value: String(settings[key]), updatedBy })
				.where(eq(appSettingsTable.key, key));

			if (Number(result[0].affectedRows) > 0) return;

			await db.insert(appSettingsTable).values({
				key,
				value: String(settings[key]),
				updatedBy,
			});
		}),
	);
}

function parseStringSetting(value: string | undefined, fallback: string) {
	const trimmed = value?.trim();
	return trimmed || fallback;
}

function parseNumberSetting(value: string | undefined, fallback: number) {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
