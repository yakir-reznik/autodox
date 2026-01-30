// Overrideable Form Settings
//
// Settings that can be defined at the form level and overridden per submission.
// The resolution rule is: submission value ?? form value ?? null.
//
// To add a new overrideable setting:
// 1. Add the column to both formsTable and submissionsTable in server/db/schema.ts
// 2. Add the key to OVERRIDEABLE_FORM_SETTINGS below
// 3. Ask the operator to run the migration

export const OVERRIDEABLE_FORM_SETTINGS = ["password", "webhookUrl", "webhookIncludePdf"] as const;

export type OverrideableFormSetting = (typeof OVERRIDEABLE_FORM_SETTINGS)[number];

type SettingsSource = Record<string, unknown>;

/**
 * Resolves effective form settings by applying submission-level overrides.
 * For each overrideable key: submission value ?? form value ?? null.
 */
export function resolveFormSettings(
	form: SettingsSource,
	submission?: SettingsSource | null,
): Record<OverrideableFormSetting, unknown> {
	const result = {} as Record<OverrideableFormSetting, unknown>;
	for (const key of OVERRIDEABLE_FORM_SETTINGS) {
		result[key] = submission?.[key] ?? form[key] ?? null;
	}
	return result;
}
