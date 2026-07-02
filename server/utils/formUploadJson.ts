import { db } from "~~/server/db";
import { eq } from "drizzle-orm";
import {
	formsTable,
	formElementsTable,
	elementTypeEnum,
	type ConditionAction,
	type ConditionGroup,
	type ConditionOperator,
	type ElementConfig,
	type ElementType,
	type SelectionOption,
} from "~~/server/db/schema";

export type UploadCondition = {
	fieldId: string;
	operator: string;
	value?: string | number | boolean;
};

export type UploadConditionLogic = "and" | "or";
export type UploadAlign = "left" | "center" | "right";

export type UploadElement = {
	type: string;
	id?: string;
	label?: string;
	placeholder?: string;
	helpText?: string;
	required?: boolean;
	options?: string[];
	allowOther?: boolean;
	text?: string;
	align?: UploadAlign;
	url?: string;
	caption?: string;
	height?: number;
	style?: "solid" | "dashed" | "dotted";
	step?: number;
	rows?: number;
	defaultValue?: string | number | boolean;
	autocomplete?: string;
	minItems?: number;
	maxItems?: number;
	addButtonText?: string;
	children?: UploadElement[];
	conditions?: UploadCondition[];
	conditionsAction?: "show" | "hide";
	conditionsLogic?: UploadConditionLogic;
	requiredConditions?: UploadCondition[];
	requiredConditionsLogic?: UploadConditionLogic;
};

export type UploadFormBody = {
	title?: string;
	description?: string;
	elements: UploadElement[];
};

export type UploadJsonValidationError = {
	path: string;
	message: string;
};

type NormalizeOptions = {
	requireTitle?: boolean;
};

type ConditionUpdate = {
	dbId: number;
	conditions?: UploadCondition[];
	conditionsAction?: "show" | "hide";
	conditionsLogic?: UploadConditionLogic;
	requiredConditions?: UploadCondition[];
	requiredConditionsLogic?: UploadConditionLogic;
};

const fieldTypes: ElementType[] = [
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
];

const validTypes = new Set<string>(elementTypeEnum);
const validAligns = new Set<UploadAlign>(["left", "center", "right"]);
const validConditionLogics = new Set<UploadConditionLogic>(["and", "or"]);
const validConditionActions = new Set(["show", "hide"]);
const validStyles = new Set(["solid", "dashed", "dotted"]);

export function normalizeAndValidateUploadForm(
	input: unknown,
	options: NormalizeOptions = {},
): { body: UploadFormBody | null; errors: UploadJsonValidationError[] } {
	const errors: UploadJsonValidationError[] = [];

	if (!isRecord(input)) {
		return {
			body: null,
			errors: [{ path: "$", message: "Body must be an object" }],
		};
	}

	const title = typeof input.title === "string" ? input.title.trim() : undefined;
	const description = typeof input.description === "string" ? input.description.trim() : undefined;

	if (options.requireTitle && !title) {
		errors.push({ path: "title", message: "Title is required" });
	}

	if (!Array.isArray(input.elements) || input.elements.length === 0) {
		errors.push({
			path: "elements",
			message: "Elements array is required and must not be empty",
		});
	}

	const elements = Array.isArray(input.elements)
		? input.elements.map((element, index) => normalizeElement(element, `elements[${index}]`, errors))
		: [];

	return {
		body: errors.length ? null : {
			...(title ? { title } : {}),
			...(description ? { description } : {}),
			elements: elements as UploadElement[],
		},
		errors,
	};
}

export function throwUploadJsonValidationError(errors: UploadJsonValidationError[]): never {
	throw createError({
		statusCode: 400,
		message: errors[0]?.message ?? "Invalid form JSON",
		data: { errors },
	});
}

export async function createFormFromUploadJson(body: UploadFormBody, userId: number) {
	if (!body.title) {
		throwUploadJsonValidationError([{ path: "title", message: "Title is required" }]);
	}

	const formResult = await db.insert(formsTable).values({
		title: body.title,
		description: body.description || null,
		status: "draft",
		createdBy: userId,
	});
	const formId = formResult[0].insertId;

	await insertUploadElements(formId, body.elements);

	return formId;
}

export async function replaceFormFromUploadJson(formId: number, body: UploadFormBody) {
	if (body.title) {
		await db
			.update(formsTable)
			.set({
				title: body.title,
				description: body.description || null,
			})
			.where(eq(formsTable.id, formId));
	}

	await db
		.update(formElementsTable)
		.set({ isDeleted: true })
		.where(eq(formElementsTable.formId, formId));

	await insertUploadElements(formId, body.elements);
}

function normalizeElement(
	input: unknown,
	path: string,
	errors: UploadJsonValidationError[],
): UploadElement | null {
	if (!isRecord(input)) {
		errors.push({ path, message: "Element must be an object" });
		return null;
	}

	const type = typeof input.type === "string" ? input.type : "";
	if (!type || !validTypes.has(type)) {
		errors.push({
			path: `${path}.type`,
			message: `Invalid element type "${type}". Valid types: ${elementTypeEnum.join(", ")}`,
		});
	}

	const element: UploadElement = { type };
	assignString(input, element, "id");
	assignString(input, element, "label");
	assignString(input, element, "placeholder");
	assignString(input, element, "helpText");
	assignString(input, element, "text");
	assignString(input, element, "url");
	assignString(input, element, "caption");
	assignString(input, element, "autocomplete");
	assignString(input, element, "addButtonText");
	assignBoolean(input, element, "required");
	assignBoolean(input, element, "allowOther");
	assignNumber(input, element, "height");
	assignNumber(input, element, "step");
	assignNumber(input, element, "rows");
	assignNumber(input, element, "minItems");
	assignNumber(input, element, "maxItems");

	if (isStringNumberOrBoolean(input.defaultValue)) {
		element.defaultValue = input.defaultValue;
	}

	const align = typeof input.align === "string" ? input.align : input.alignment;
	if (typeof align === "string") {
		if (validAligns.has(align as UploadAlign)) {
			element.align = align as UploadAlign;
		} else {
			errors.push({ path: `${path}.align`, message: "Alignment must be left, center, or right" });
		}
	}

	if (typeof input.style === "string") {
		if (validStyles.has(input.style)) {
			element.style = input.style as UploadElement["style"];
		} else {
			errors.push({ path: `${path}.style`, message: "Style must be solid, dashed, or dotted" });
		}
	}

	if (Array.isArray(input.options)) {
		const options = input.options.filter((option): option is string => typeof option === "string");
		if (options.length !== input.options.length) {
			errors.push({ path: `${path}.options`, message: "Options must be strings" });
		}
		element.options = options;
	}

	element.conditions = normalizeConditions(input.conditions, `${path}.conditions`, errors);
	element.requiredConditions = normalizeConditions(input.requiredConditions, `${path}.requiredConditions`, errors);
	assignLogic(input, element, "conditionsLogic", path, errors);
	assignLogic(input, element, "requiredConditionsLogic", path, errors);

	if (typeof input.conditionsAction === "string") {
		if (validConditionActions.has(input.conditionsAction)) {
			element.conditionsAction = input.conditionsAction as "show" | "hide";
		} else {
			errors.push({ path: `${path}.conditionsAction`, message: "Condition action must be show or hide" });
		}
	}

	if ((type === "section" || type === "repeater") && Array.isArray(input.children)) {
		element.children = input.children
			.map((child, index) => normalizeElement(child, `${path}.children[${index}]`, errors))
			.filter((child): child is UploadElement => !!child);
	} else if ((type === "section" || type === "repeater") && input.children !== undefined) {
		errors.push({ path: `${path}.children`, message: "Children must be an array" });
	}

	return element;
}

function normalizeConditions(
	input: unknown,
	path: string,
	errors: UploadJsonValidationError[],
) {
	if (input === undefined) return undefined;
	if (!Array.isArray(input)) {
		errors.push({ path, message: "Conditions must be an array" });
		return undefined;
	}

	return input.map((condition, index) => {
		if (!isRecord(condition)) {
			errors.push({ path: `${path}[${index}]`, message: "Condition must be an object" });
			return { fieldId: "", operator: "==" };
		}

		const fieldId = typeof condition.fieldId === "string" ? condition.fieldId : "";
		const operator = typeof condition.operator === "string" ? condition.operator : "";
		if (!fieldId) errors.push({ path: `${path}[${index}].fieldId`, message: "Field ID is required" });
		if (!operator) errors.push({ path: `${path}[${index}].operator`, message: "Operator is required" });

		return {
			fieldId,
			operator,
			...(isStringNumberOrBoolean(condition.value) ? { value: condition.value } : {}),
		};
	});
}

function assignString(input: Record<string, unknown>, element: UploadElement, key: keyof UploadElement) {
	if (typeof input[key] === "string") {
		(element as Record<string, unknown>)[key] = input[key];
	}
}

function assignBoolean(input: Record<string, unknown>, element: UploadElement, key: keyof UploadElement) {
	if (typeof input[key] === "boolean") {
		(element as Record<string, unknown>)[key] = input[key];
	}
}

function assignNumber(input: Record<string, unknown>, element: UploadElement, key: keyof UploadElement) {
	if (typeof input[key] === "number") {
		(element as Record<string, unknown>)[key] = input[key];
	}
}

function assignLogic(
	input: Record<string, unknown>,
	element: UploadElement,
	key: "conditionsLogic" | "requiredConditionsLogic",
	path: string,
	errors: UploadJsonValidationError[],
) {
	if (typeof input[key] !== "string") return;
	if (validConditionLogics.has(input[key] as UploadConditionLogic)) {
		element[key] = input[key] as UploadConditionLogic;
	} else {
		errors.push({ path: `${path}.${key}`, message: "Condition logic must be and or or" });
	}
}

async function insertUploadElements(formId: number, elements: UploadElement[]) {
	let position = 0;
	const nameCounts: Record<string, number> = {};
	const nameToDbId: Record<string, number> = {};
	const conditionUpdates: ConditionUpdate[] = [];

	function generateName(type: ElementType): string {
		nameCounts[type] = (nameCounts[type] || 0) + 1;
		return `${type}_${nameCounts[type]}`;
	}

	async function insertElements(items: UploadElement[], parentId: number | null = null): Promise<void> {
		for (const element of items) {
			position += 10;
			const type = element.type as ElementType;
			const isField = fieldTypes.includes(type);
			const name = element.id || (isField ? generateName(type) : null);
			const result = await db.insert(formElementsTable).values({
				formId,
				type,
				position: position.toFixed(5),
				parentId,
				name,
				config: buildConfig(element),
				isRequired: element.required ?? false,
			});
			const dbId = result[0].insertId;

			if (name) nameToDbId[name] = dbId;
			if (element.conditions?.length || element.requiredConditions?.length) {
				conditionUpdates.push({
					dbId,
					conditions: element.conditions,
					conditionsAction: element.conditionsAction,
					conditionsLogic: element.conditionsLogic,
					requiredConditions: element.requiredConditions,
					requiredConditionsLogic: element.requiredConditionsLogic,
				});
			}

			if ((type === "section" || type === "repeater") && element.children?.length) {
				await insertElements(element.children, dbId);
			}
		}
	}

	await insertElements(elements);
	await applyConditionUpdates(conditionUpdates, nameToDbId);
}

async function applyConditionUpdates(
	conditionUpdates: ConditionUpdate[],
	nameToDbId: Record<string, number>,
) {
	for (const update of conditionUpdates) {
		const conditionGroup = update.conditions?.length
			? buildConditionGroup(update.conditions, update.conditionsAction ?? "show", update.conditionsLogic ?? "and", nameToDbId)
			: update.requiredConditions?.length
				? buildConditionGroup(update.requiredConditions, "require", update.requiredConditionsLogic ?? "and", nameToDbId)
				: null;

		if (!conditionGroup) continue;

		const existing = await db.query.formElementsTable.findFirst({
			where: eq(formElementsTable.id, update.dbId),
		});
		if (!existing) continue;

		await db
			.update(formElementsTable)
			.set({ config: { ...(existing.config as object), _conditions: conditionGroup } as ElementConfig })
			.where(eq(formElementsTable.id, update.dbId));
	}
}

function buildConditionGroup(
	conditions: UploadCondition[],
	action: ConditionAction,
	logic: UploadConditionLogic,
	nameToDbId: Record<string, number>,
): ConditionGroup {
	return {
		enabled: true,
		action,
		logic,
		rules: conditions.map((condition) => ({
			sourceFieldId: String(nameToDbId[condition.fieldId] ?? condition.fieldId),
			operator: mapOperator(condition.operator),
			value: condition.value ?? "",
		})),
	};
}

function mapOperator(op: string): ConditionOperator {
	const map: Record<string, ConditionOperator> = {
		"==": "equals",
		"!=": "not_equals",
		contains: "contains",
		not_contains: "not_equals",
		greater_than: "greater_than",
		less_than: "less_than",
		is_empty: "is_empty",
		is_not_empty: "is_not_empty",
	};
	return map[op] ?? "equals";
}

function buildConfig(element: UploadElement): ElementConfig {
	const type = element.type as ElementType;

	if (["text", "email", "date", "time", "datetime"].includes(type)) {
		return {
			label: element.label || getDefaultLabel(type),
			placeholder: element.placeholder || "",
			helpText: element.helpText || "",
			...(element.defaultValue !== undefined ? { defaultValue: element.defaultValue } : {}),
			...(element.autocomplete ? { autocomplete: element.autocomplete } : {}),
			validation: { required: element.required ?? false },
		};
	}

	if (type === "phone") {
		return {
			label: element.label || "Phone Number",
			placeholder: element.placeholder || "",
			helpText: element.helpText || "",
			autocomplete: element.autocomplete || "tel",
			validation: { required: element.required ?? false },
		};
	}

	if (type === "number") {
		return {
			label: element.label || "Number",
			placeholder: element.placeholder || "",
			helpText: element.helpText || "",
			step: element.step ?? 1,
			...(element.defaultValue !== undefined ? { defaultValue: element.defaultValue } : {}),
			validation: { required: element.required ?? false },
		};
	}

	if (type === "textarea") {
		return {
			label: element.label || "Text Area",
			placeholder: element.placeholder || "",
			helpText: element.helpText || "",
			rows: element.rows ?? 4,
			validation: { required: element.required ?? false },
		};
	}

	if (["dropdown", "radio", "checkboxes"].includes(type)) {
		const options: SelectionOption[] = (element.options || ["Option 1", "Option 2"]).map(
			(option, index) => ({
				id: `opt${index + 1}`,
				label: option,
				value: option.toLowerCase().replace(/\s+/g, "_"),
			}),
		);

		return {
			label: element.label || getDefaultLabel(type),
			placeholder: type === "dropdown" ? "Select an option" : undefined,
			helpText: element.helpText || "",
			options,
			...(element.allowOther ? { allowOther: true } : {}),
			...(element.defaultValue !== undefined ? { defaultValue: element.defaultValue } : {}),
			validation: { required: element.required ?? false },
		};
	}

	if (type === "checkbox") {
		return {
			label: element.label || "Checkbox",
			helpText: element.helpText || "",
			validation: { required: element.required ?? false },
		};
	}

	if (type === "signature") {
		return {
			label: element.label || "Signature",
			helpText: element.helpText || "נא לחתום במלבן מטה",
			maxWidth: 400,
			maxHeight: 200,
			validation: { required: element.required ?? false },
		};
	}

	if (["heading_h1", "heading_h2", "heading_h3"].includes(type)) {
		return {
			text: element.text || "Heading",
			align: element.align || "right",
		};
	}

	if (type === "paragraph") {
		return {
			text: element.text || "Enter text here...",
			align: element.align || "right",
		};
	}

	if (type === "image" || type === "video") {
		return {
			url: element.url || "",
			alt: "",
			caption: element.caption || "",
		};
	}

	if (type === "divider") {
		return {
			style: element.style || "solid",
			color: "#e5e7eb",
		};
	}

	if (type === "spacer") {
		return {
			height: element.height || 24,
		};
	}

	if (type === "section") {
		return {
			title: element.label || "Section",
			description: "",
			collapsible: false,
			defaultCollapsed: false,
			bordered: true,
			backgroundColor: "#f9fafb",
		};
	}

	if (type === "repeater") {
		return {
			label: element.label || "Repeater",
			helpText: element.helpText || "",
			minItems: element.minItems ?? 1,
			maxItems: element.maxItems,
			addButtonText: element.addButtonText || "Add Item",
			bordered: true,
			backgroundColor: "#f9fafb",
		};
	}

	return {};
}

function getDefaultLabel(type: string): string {
	const labels: Record<string, string> = {
		text: "Text Field",
		email: "Email",
		number: "Number",
		textarea: "Text Area",
		date: "Date",
		time: "Time",
		datetime: "Date & Time",
		dropdown: "Dropdown",
		radio: "Radio Selection",
		checkboxes: "Checkboxes",
		checkbox: "Checkbox",
		signature: "Signature",
	};
	return labels[type] || "Field";
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringNumberOrBoolean(value: unknown): value is string | number | boolean {
	return ["string", "number", "boolean"].includes(typeof value);
}
