import { db } from "~~/server/db";
import { eq } from "drizzle-orm";
import {
	formsTable,
	formElementsTable,
	elementTypeEnum,
	type ElementType,
	type ElementConfig,
	type SelectionOption,
} from "~~/server/db/schema";

// Simplified JSON structure for ChatGPT-generated forms
interface UploadElement {
	type: string;
	label?: string;
	placeholder?: string;
	helpText?: string;
	required?: boolean;
	options?: string[];
	text?: string;
	align?: "left" | "center" | "right";
	url?: string;
	caption?: string;
	height?: number;
	style?: "solid" | "dashed" | "dotted";
	children?: UploadElement[];
}

interface UploadFormBody {
	title?: string;
	description?: string;
	elements: UploadElement[];
}

// Field types that need a name identifier
const fieldTypes: ElementType[] = [
	"text",
	"email",
	"number",
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

export default defineEventHandler(async (event) => {
	// Get user from session
	const session = await getUserSession(event);
	if (!session.user) {
		throw createError({
			statusCode: 401,
			message: "Authentication required",
		});
	}

	const formId = Number(event.context.params?.id);

	if (isNaN(formId)) {
		throw createError({
			statusCode: 400,
			message: "Invalid form ID",
		});
	}

	// Verify the form exists and user can edit it
	const form = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, formId),
	});

	if (!form) {
		throw createError({
			statusCode: 404,
			message: "Form not found",
		});
	}

	// Check if user is authorized to edit this form
	if (form.createdBy !== session.user.id) {
		throw createError({
			statusCode: 403,
			message: "Not authorized to edit this form",
		});
	}

	const body = await readBody<UploadFormBody>(event);

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

	// Update form metadata if provided
	if (body.title) {
		await db.update(formsTable).set({
			title: body.title.trim(),
			description: body.description?.trim() || null,
		}).where(eq(formsTable.id, formId));
	}

	// Soft delete all existing elements
	await db.update(formElementsTable).set({
		isDeleted: true,
	}).where(eq(formElementsTable.formId, formId));

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
				validation: { required: el.required ?? false },
			};
		}

		// Number field
		if (type === "number") {
			return {
				label: el.label || "Number",
				placeholder: el.placeholder || "",
				helpText: el.helpText || "",
				step: 1,
				validation: { required: el.required ?? false },
			};
		}

		// Textarea
		if (type === "textarea") {
			return {
				label: el.label || "Text Area",
				placeholder: el.placeholder || "",
				helpText: el.helpText || "",
				rows: 4,
				validation: { required: el.required ?? false },
			};
		}

		// Selection fields (dropdown, radio, checkboxes)
		if (["dropdown", "radio", "checkboxes"].includes(type)) {
			const options: SelectionOption[] = (el.options || ["Option 1", "Option 2"]).map((opt, i) => ({
				id: `opt${i + 1}`,
				label: opt,
				value: opt.toLowerCase().replace(/\s+/g, "_"),
			}));

			return {
				label: el.label || getDefaultLabel(type),
				placeholder: type === "dropdown" ? "Select an option" : undefined,
				helpText: el.helpText || "",
				options,
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
				helpText: el.helpText || "Draw your signature",
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

	async function insertElements(elements: UploadElement[], parentId: number | null = null): Promise<void> {
		for (const el of elements) {
			position += 10;
			const type = el.type as ElementType;
			const config = buildConfig(el);
			const isField = fieldTypes.includes(type);
			const name = isField ? generateName(type) : null;

			const result = await db.insert(formElementsTable).values({
				formId,
				type,
				position: position.toFixed(5),
				parentId,
				name,
				config,
				isRequired: el.required ?? false,
			});

			// Handle children for sections
			if (type === "section" && el.children && el.children.length > 0) {
				const sectionId = result[0].insertId;
				await insertElements(el.children, sectionId);
			}
		}
	}

	await insertElements(body.elements);

	return {
		formId,
		success: true,
	};
});
