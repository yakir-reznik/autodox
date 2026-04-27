import { db } from "~~/server/db";
import { eq } from "drizzle-orm";
import { requireRoles } from "~~/server/utils/authorization";
import {
	formsTable,
	formElementsTable,
	elementTypeEnum,
	type ElementType,
	type ElementConfig,
	type SelectionOption,
	type ConditionGroup,
	type ConditionAction,
	type ConditionOperator,
} from "~~/server/db/schema";

type UploadCondition = {
	fieldId: string;
	operator: string;
	value?: string;
};

type UploadConditionLogic = "and" | "or";

// Simplified JSON structure for ChatGPT-generated forms
interface UploadElement {
	type: string;
	id?: string;
	label?: string;
	placeholder?: string;
	helpText?: string;
	required?: boolean;
	options?: string[];
	allowOther?: boolean;
	text?: string;
	align?: "left" | "center" | "right";
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
}

interface UploadFormBody {
	title: string;
	description?: string;
	elements: UploadElement[];
}

// Field types that need a name identifier
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

function mapOperator(op: string): ConditionOperator {
	const map: Record<string, ConditionOperator> = {
		"==": "equals",
		"!=": "not_equals",
		"contains": "contains",
		"not_contains": "not_equals",
		"greater_than": "greater_than",
		"less_than": "less_than",
		"is_empty": "is_empty",
		"is_not_empty": "is_not_empty",
	};
	return map[op] ?? "equals";
}

function buildConditionGroup(conditions: UploadCondition[], action: ConditionAction, logic: "and" | "or", nameToDbId: Record<string, number>): ConditionGroup {
	return {
		enabled: true,
		action,
		logic,
		rules: conditions.map((c) => ({
			sourceFieldId: String(nameToDbId[c.fieldId] ?? c.fieldId),
			operator: mapOperator(c.operator),
			value: c.value ?? "",
		})),
	};
}

export default defineEventHandler(async (event) => {
	const session = await requireRoles(event, ["user"]);

	const body = await readBody<UploadFormBody>(event);

	// Validate title
	if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
		throw createError({
			statusCode: 400,
			message: "Title is required",
		});
	}

	// Validate elements array
	if (!Array.isArray(body.elements) || body.elements.length === 0) {
		throw createError({
			statusCode: 400,
			message: "Elements array is required and must not be empty",
		});
	}

	// Valid element types set
	const validTypes = new Set<string>(elementTypeEnum);

	// Validate each element type
	function validateElement(el: UploadElement, path: string): void {
		if (!el.type || !validTypes.has(el.type)) {
			throw createError({
				statusCode: 400,
				message: `Invalid element type "${el.type}" at ${path}. Valid types: ${elementTypeEnum.join(", ")}`,
			});
		}
		// Validate nested children for sections
		if (el.type === "section" && el.children) {
			el.children.forEach((child, i) => validateElement(child, `${path}.children[${i}]`));
		}
	}

	body.elements.forEach((el, i) => validateElement(el, `elements[${i}]`));

	// Create the form
	const formResult = await db.insert(formsTable).values({
		title: body.title.trim(),
		description: body.description?.trim() || null,
		status: "draft",
		createdBy: session.user.id,
	});
	const formId = formResult[0].insertId;

	// Track name counts for generating unique names
	const nameCounts: Record<string, number> = {};

	function generateName(type: ElementType): string {
		nameCounts[type] = (nameCounts[type] || 0) + 1;
		return `${type}_${nameCounts[type]}`;
	}

	// Build config based on element type
	function buildConfig(el: UploadElement): ElementConfig {
		const type = el.type as ElementType;

		// Input fields
		if (["text", "email", "date", "time", "datetime"].includes(type)) {
			return {
				label: el.label || getDefaultLabel(type),
				placeholder: el.placeholder || "",
				helpText: el.helpText || "",
				...(el.defaultValue !== undefined ? { defaultValue: el.defaultValue } : {}),
				...(el.autocomplete ? { autocomplete: el.autocomplete } : {}),
				validation: { required: el.required ?? false },
			};
		}

		// Phone field
		if (type === "phone") {
			return {
				label: el.label || "Phone Number",
				placeholder: el.placeholder || "",
				helpText: el.helpText || "",
				autocomplete: el.autocomplete || "tel",
				validation: { required: el.required ?? false },
			};
		}

		// Number field
		if (type === "number") {
			return {
				label: el.label || "Number",
				placeholder: el.placeholder || "",
				helpText: el.helpText || "",
				step: el.step ?? 1,
				...(el.defaultValue !== undefined ? { defaultValue: el.defaultValue } : {}),
				validation: { required: el.required ?? false },
			};
		}

		// Textarea
		if (type === "textarea") {
			return {
				label: el.label || "Text Area",
				placeholder: el.placeholder || "",
				helpText: el.helpText || "",
				rows: el.rows ?? 4,
				validation: { required: el.required ?? false },
			};
		}

		// Selection fields (dropdown, radio, checkboxes)
		if (["dropdown", "radio", "checkboxes"].includes(type)) {
			const options: SelectionOption[] = (el.options || ["Option 1", "Option 2"]).map(
				(opt, i) => ({
					id: `opt${i + 1}`,
					label: opt,
					value: opt.toLowerCase().replace(/\s+/g, "_"),
				}),
			);

			return {
				label: el.label || getDefaultLabel(type),
				placeholder: type === "dropdown" ? "Select an option" : undefined,
				helpText: el.helpText || "",
				options,
				...(el.allowOther ? { allowOther: true } : {}),
				...(el.defaultValue !== undefined ? { defaultValue: el.defaultValue } : {}),
				validation: { required: el.required ?? false },
			};
		}

		// Checkbox (single)
		if (type === "checkbox") {
			return {
				label: el.label || "Checkbox",
				helpText: el.helpText || "",
				validation: { required: el.required ?? false },
			};
		}

		// Signature
		if (type === "signature") {
			return {
				label: el.label || "Signature",
				helpText: el.helpText || "נא לחתום במלבן מטה",
				maxWidth: 400,
				maxHeight: 200,
				validation: { required: el.required ?? false },
			};
		}

		// Headings
		if (["heading_h1", "heading_h2", "heading_h3"].includes(type)) {
			return {
				text: el.text || "Heading",
				align: el.align || "right",
			};
		}

		// Paragraph
		if (type === "paragraph") {
			return {
				text: el.text || "Enter text here...",
				align: el.align || "right",
			};
		}

		// Image/Video
		if (type === "image" || type === "video") {
			return {
				url: el.url || "",
				alt: "",
				caption: el.caption || "",
			};
		}

		// Divider
		if (type === "divider") {
			return {
				style: el.style || "solid",
				color: "#e5e7eb",
			};
		}

		// Spacer
		if (type === "spacer") {
			return {
				height: el.height || 24,
			};
		}

		// Section
		if (type === "section") {
			return {
				title: el.label || "Section",
				description: "",
				collapsible: false,
				defaultCollapsed: false,
				bordered: true,
				backgroundColor: "#f9fafb",
			};
		}

		// Repeater
		if (type === "repeater") {
			return {
				label: el.label || "Repeater",
				helpText: el.helpText || "",
				minItems: el.minItems ?? 1,
				maxItems: el.maxItems,
				addButtonText: el.addButtonText || "Add Item",
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

	// Insert elements with positions
	let position = 0;
	const nameToDbId: Record<string, number> = {};
	const conditionUpdates: Array<{
		dbId: number;
		conditions?: UploadCondition[];
		conditionsAction?: "show" | "hide";
		conditionsLogic?: UploadConditionLogic;
		requiredConditions?: UploadCondition[];
		requiredConditionsLogic?: UploadConditionLogic;
	}> = [];

	async function insertElements(
		elements: UploadElement[],
		parentId: number | null = null,
	): Promise<void> {
		for (const el of elements) {
			position += 10;
			const type = el.type as ElementType;
			const config = buildConfig(el);
			const isField = fieldTypes.includes(type);
			const name = el.id || (isField ? generateName(type) : null);

			const result = await db.insert(formElementsTable).values({
				formId,
				type,
				position: position.toFixed(5),
				parentId,
				name,
				config,
				isRequired: el.required ?? false,
			});

			const dbId = result[0].insertId;
			if (name) nameToDbId[name] = dbId;

			if (el.conditions?.length || el.requiredConditions?.length) {
				conditionUpdates.push({
					dbId,
					conditions: el.conditions,
					conditionsAction: el.conditionsAction,
					conditionsLogic: el.conditionsLogic,
					requiredConditions: el.requiredConditions,
					requiredConditionsLogic: el.requiredConditionsLogic,
				});
			}

			// Handle children for sections and repeaters
			if ((type === "section" || type === "repeater") && el.children && el.children.length > 0) {
				await insertElements(el.children, dbId);
			}
		}
	}

	await insertElements(body.elements);

	// Second pass: resolve condition field references and store in config
	for (const { dbId, conditions, conditionsAction, conditionsLogic, requiredConditions, requiredConditionsLogic } of conditionUpdates) {
		const condGroup = conditions?.length
			? buildConditionGroup(conditions, conditionsAction ?? "show", conditionsLogic ?? "and", nameToDbId)
			: requiredConditions?.length
				? buildConditionGroup(requiredConditions, "require", requiredConditionsLogic ?? "and", nameToDbId)
				: null;

		if (!condGroup) continue;

		const existing = await db.query.formElementsTable.findFirst({
			where: eq(formElementsTable.id, dbId),
		});
		if (!existing) continue;

		await db
			.update(formElementsTable)
			.set({ config: { ...(existing.config as object), _conditions: condGroup } as ElementConfig })
			.where(eq(formElementsTable.id, dbId));
	}

	return {
		formId,
		success: true,
	};
});
