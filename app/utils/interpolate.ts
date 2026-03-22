import type { BuilderElement, SelectionOption } from "~/types/form-builder";
import { isFieldElement } from "~/composables/useElementDefaults";

type InterpolatableField = {
	name: string;
	label: string;
	clientId: string;
};

const TOKEN_REGEX = /\{\{(\w+)\}\}/g;

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function getInterpolatableFields(elements: BuilderElement[]): InterpolatableField[] {
	const repeaterIds = new Set(
		elements.filter((el) => el.type === "repeater").map((el) => el.clientId),
	);

	return elements
		.filter((el) => {
			if (!isFieldElement(el.type)) return false;
			if (el.type === "repeater") return false;
			if (el.parentId && repeaterIds.has(el.parentId)) return false;
			if (!el.name) return false;
			return true;
		})
		.map((el) => ({
			name: el.name!,
			label: (el.config as any).label || el.name!,
			clientId: el.clientId,
		}));
}

function getDisplayValue(element: BuilderElement, rawValue: any): string {
	const config = element.config as any;
	const options: SelectionOption[] | undefined = config.options;

	if (rawValue == null || rawValue === "") return "_____";

	if (element.type === "checkbox") {
		return rawValue ? "V" : "-";
	}

	if (options && ["dropdown", "radio"].includes(element.type)) {
		const option = options.find((o) => o.value === rawValue);
		return option?.label || String(rawValue);
	}

	if (options && element.type === "checkboxes" && Array.isArray(rawValue)) {
		if (rawValue.length === 0) return "_____";
		return rawValue
			.map((v: string) => {
				const option = options.find((o) => o.value === v);
				return option?.label || v;
			})
			.join(", ");
	}

	return String(rawValue);
}

export function interpolateFieldValues(
	text: string,
	elements: BuilderElement[],
	formData: Record<string, any>,
): string {
	const fields = getInterpolatableFields(elements);

	return text.replace(TOKEN_REGEX, (match, fieldName: string) => {
		const field = fields.find((f) => f.name === fieldName);
		if (!field) return match;

		const rawValue = formData[field.clientId];
		const displayValue = getDisplayValue(
			elements.find((el) => el.clientId === field.clientId)!,
			rawValue,
		);

		return escapeHtml(displayValue);
	});
}
