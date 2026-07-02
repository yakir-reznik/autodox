import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getAppSettings } from "~~/server/utils/appSettings";
import type { UploadFormBody, UploadJsonValidationError } from "~~/server/utils/formUploadJson";

export type AiImportFile = {
	filename: string;
	mimeType: string;
	data: Buffer;
};

export type AiFormImportResult = {
	json: unknown;
	usage?: unknown;
	model?: string;
};

export type AiFormImportProvider = {
	extractForm(file: AiImportFile, prompt: string, schema: Record<string, unknown>): Promise<AiFormImportResult>;
	repairFormJson(json: unknown, errors: UploadJsonValidationError[], schema: Record<string, unknown>): Promise<AiFormImportResult>;
};

type OpenRouterChoice = {
	message?: {
		content?: string | Array<{ type?: string; text?: string }>;
	};
};

type OpenRouterResponse = {
	choices?: OpenRouterChoice[];
	usage?: unknown;
	model?: string;
	error?: {
		message?: string;
	};
};

const aiFormImportPrompt = readFileSync(
	join(process.cwd(), "shared/prompts/ai-form-json-generation-prompt.txt"),
	"utf8",
);
export { aiFormImportPrompt };

export async function getAiFormImportSettings() {
	const settings = await getAppSettings();

	return {
		model: settings.aiFormImportModel,
		maxFileSizeBytes: settings.aiFormImportMaxFileSizeMb * 1024 * 1024,
	};
}

export const aiFormImportJsonSchema = {
	type: "object",
	additionalProperties: false,
	required: ["title", "elements"],
	properties: {
		title: { type: "string" },
		description: { type: "string" },
		elements: {
			type: "array",
			minItems: 1,
			items: { $ref: "#/$defs/element" },
		},
	},
	$defs: {
		condition: {
			type: "object",
			additionalProperties: false,
			required: ["fieldId", "operator"],
			properties: {
				fieldId: { type: "string" },
				operator: {
					type: "string",
					enum: ["==", "!=", "contains", "not_contains", "greater_than", "less_than", "is_empty", "is_not_empty"],
				},
				value: { type: ["string", "number", "boolean"] },
			},
		},
		element: {
			type: "object",
			additionalProperties: false,
			required: ["type"],
			properties: {
				type: {
					type: "string",
					enum: [
						"text",
						"email",
						"number",
						"phone",
						"textarea",
						"date",
						"time",
						"datetime",
						"dropdown",
						"radio",
						"checkbox",
						"checkboxes",
						"signature",
						"repeater",
						"heading_h1",
						"heading_h2",
						"heading_h3",
						"paragraph",
						"image",
						"video",
						"divider",
						"spacer",
						"section",
					],
				},
				id: { type: "string" },
				label: { type: "string" },
				placeholder: { type: "string" },
				helpText: { type: "string" },
				required: { type: "boolean" },
				options: {
					type: "array",
					items: { type: "string" },
				},
				allowOther: { type: "boolean" },
				text: { type: "string" },
				align: { type: "string", enum: ["left", "center", "right"] },
				alignment: { type: "string", enum: ["left", "center", "right"] },
				url: { type: "string" },
				caption: { type: "string" },
				height: { type: "number" },
				style: { type: "string", enum: ["solid", "dashed", "dotted"] },
				step: { type: "number" },
				rows: { type: "number" },
				defaultValue: { type: ["string", "number", "boolean"] },
				autocomplete: { type: "string" },
				minItems: { type: "number" },
				maxItems: { type: "number" },
				addButtonText: { type: "string" },
				children: {
					type: "array",
					items: { $ref: "#/$defs/element" },
				},
				conditions: {
					type: "array",
					items: { $ref: "#/$defs/condition" },
				},
				conditionsAction: { type: "string", enum: ["show", "hide"] },
				conditionsLogic: { type: "string", enum: ["and", "or"] },
				requiredConditions: {
					type: "array",
					items: { $ref: "#/$defs/condition" },
				},
				requiredConditionsLogic: { type: "string", enum: ["and", "or"] },
			},
		},
	},
} satisfies Record<string, unknown>;

export async function getAiFormImportProvider(): Promise<AiFormImportProvider> {
	const config = useRuntimeConfig();
	const settings = await getAiFormImportSettings();

	if (!config.openrouterApiKey) {
		throw createError({
			statusCode: 500,
			message: "OPEN_ROUTER_API_KEY is not configured",
		});
	}

	return new OpenRouterFormImportProvider(
		config.openrouterApiKey,
		settings.model,
	);
}

class OpenRouterFormImportProvider implements AiFormImportProvider {
	constructor(
		private readonly apiKey: string,
		private readonly model: string,
	) {}

	async extractForm(file: AiImportFile, prompt: string, schema: Record<string, unknown>) {
		const content = [
			{ type: "text", text: prompt },
			getFileContentPart(file),
		];

		return this.complete(content, schema);
	}

	async repairFormJson(json: unknown, errors: UploadJsonValidationError[], schema: Record<string, unknown>) {
		return this.complete(
			`Repair this Autodox form JSON so it passes validation. Return only corrected JSON.\n\nValidation errors:\n${JSON.stringify(errors, null, 2)}\n\nJSON:\n${JSON.stringify(json, null, 2)}`,
			schema,
		);
	}

	private async complete(content: unknown, schema: Record<string, unknown>): Promise<AiFormImportResult> {
		const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: this.model,
				messages: [{ role: "user", content }],
				response_format: {
					type: "json_schema",
					json_schema: {
						name: "autodox_form_upload",
						strict: true,
						schema,
					},
				},
				plugins: [{ id: "file-parser", pdf: { engine: "cloudflare-ai" } }],
				stream: false,
			}),
		});

		const result = await response.json() as OpenRouterResponse;

		if (!response.ok) {
			throw createError({
				statusCode: response.status,
				message: result.error?.message || "AI provider request failed",
			});
		}

		const responseContent = result.choices?.[0]?.message?.content;
		const text = Array.isArray(responseContent)
			? responseContent.map((part) => part.text || "").join("")
			: responseContent;

		if (!text) {
			throw createError({
				statusCode: 502,
				message: "AI provider returned an empty response",
			});
		}

		return {
			json: parseProviderJson(text),
			usage: result.usage,
			model: result.model || this.model,
		};
	}
}

function getFileContentPart(file: AiImportFile) {
	const dataUrl = `data:${file.mimeType};base64,${file.data.toString("base64")}`;

	if (file.mimeType.startsWith("image/")) {
		return {
			type: "image_url",
			image_url: { url: dataUrl },
		};
	}

	return {
		type: "file",
		file: {
			filename: file.filename,
			file_data: dataUrl,
		},
	};
}

function parseProviderJson(text: string): UploadFormBody {
	try {
		return JSON.parse(text);
	} catch {
		const match = text.match(/\{[\s\S]*\}/);
		if (!match) throw createError({ statusCode: 502, message: "AI provider returned invalid JSON" });
		return JSON.parse(match[0]);
	}
}
