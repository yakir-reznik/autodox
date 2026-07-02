export type AppSettings = {
	aiFormImportModel: string;
	aiFormImportMaxFileSizeMb: number;
};

export const aiFormImportModelOptions = [
	{
		label: "Gemini 2.5 Flash Lite",
		value: "google/gemini-2.5-flash-lite",
	},
	{
		label: "GPT-5.5",
		value: "openai/gpt-5.5",
	},
	{
		label: "Claude Sonnet 5",
		value: "anthropic/claude-sonnet-5",
	},
	{
		label: "Gemini 2.5 Flash",
		value: "google/gemini-2.5-flash",
	},
	{
		label: "GPT-4.1 Mini",
		value: "openai/gpt-4.1-mini",
	},
	{
		label: "GPT-4o Mini",
		value: "openai/gpt-4o-mini",
	},
] as const;

export const aiFormImportModelValues = aiFormImportModelOptions.map((option) => option.value);
