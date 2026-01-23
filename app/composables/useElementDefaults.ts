import type {
	ElementType,
	ElementConfig,
	PaletteElement,
} from "~/types/form-builder";

// Default configurations for each element type
export function getDefaultConfig(type: ElementType): ElementConfig {
	switch (type) {
		// Input fields
		case "text":
			return {
				label: "שדה טקסט",
				placeholder: "",
				helpText: "",
				validation: { required: false },
			};
		case "email":
			return {
				label: "אימייל",
				placeholder: "example@email.com",
				helpText: "",
				validation: { required: false },
			};
		case "number":
			return {
				label: "מספר",
				placeholder: "",
				helpText: "",
				validation: { required: false },
				step: 1,
			};
		case "textarea":
			return {
				label: "אזור טקסט",
				placeholder: "",
				helpText: "",
				rows: 4,
				validation: { required: false },
			};
		case "date":
			return {
				label: "תאריך",
				placeholder: "",
				helpText: "",
				validation: { required: false },
			};
		case "time":
			return {
				label: "שעה",
				placeholder: "",
				helpText: "",
				validation: { required: false },
			};
		case "datetime":
			return {
				label: "תאריך ושעה",
				placeholder: "",
				helpText: "",
				validation: { required: false },
			};

		// Selection fields
		case "dropdown":
			return {
				label: "רשימה נפתחת",
				placeholder: "בחר אפשרות",
				helpText: "",
				options: [
					{ id: "opt1", label: "אפשרות 1", value: "option1" },
					{ id: "opt2", label: "אפשרות 2", value: "option2" },
				],
				validation: { required: false },
			};
		case "radio":
			return {
				label: "כפתורי בחירה",
				helpText: "",
				options: [
					{ id: "opt1", label: "אפשרות 1", value: "option1" },
					{ id: "opt2", label: "אפשרות 2", value: "option2" },
				],
				validation: { required: false },
			};
		case "checkbox":
			return {
				label: "תיבת סימון",
				helpText: "",
				validation: { required: false },
			};
		case "checkboxes":
			return {
				label: "תיבות סימון",
				helpText: "",
				options: [
					{ id: "opt1", label: "אפשרות 1", value: "option1" },
					{ id: "opt2", label: "אפשרות 2", value: "option2" },
				],
				validation: { required: false },
			};

		// Special fields
		case "signature":
			return {
				label: "חתימה",
				helpText: "צייר את החתימה שלך",
				maxWidth: 400,
				maxHeight: 200,
				validation: { required: false },
			};

		// Layout elements
		case "heading_h1":
			return {
				text: "כותרת",
				align: "right",
			};
		case "heading_h2":
			return {
				text: "כותרת משנה",
				align: "right",
			};
		case "heading_h3":
			return {
				text: "כותרת מקטע",
				align: "right",
			};
		case "paragraph":
			return {
				text: "הזן את הטקסט שלך כאן...",
				align: "right",
			};
		case "image":
			return {
				url: "",
				alt: "",
				caption: "",
			};
		case "video":
			return {
				url: "",
				caption: "",
			};
		case "divider":
			return {
				style: "solid",
				color: "#e5e7eb",
			};
		case "spacer":
			return {
				height: 24,
			};
		case "section":
			return {
				collapsible: false,
				defaultCollapsed: false,
				bordered: true,
				backgroundColor: "#f9fafb",
			};
		case "repeater":
			return {
				label: "שדה חזרה",
				helpText: "",
				minItems: 1,
				maxItems: undefined,
				addButtonText: "הוסף עוד",
				bordered: true,
				backgroundColor: "#f9fafb",
			};

		default:
			return {};
	}
}

// Palette elements organized by category
export function usePaletteElements(): PaletteElement[] {
	return [
		// Input fields
		{
			type: "text",
			label: "טקסט",
			icon: "heroicons:pencil",
			category: "input",
		},
		{
			type: "email",
			label: "אימייל",
			icon: "heroicons:envelope",
			category: "input",
		},
		{
			type: "number",
			label: "מספר",
			icon: "heroicons:hashtag",
			category: "input",
		},
		{
			type: "textarea",
			label: "אזור טקסט",
			icon: "heroicons:document-text",
			category: "input",
		},
		{
			type: "date",
			label: "תאריך",
			icon: "heroicons:calendar",
			category: "input",
		},
		{
			type: "time",
			label: "שעה",
			icon: "heroicons:clock",
			category: "input",
		},
		{
			type: "datetime",
			label: "תאריך ושעה",
			icon: "heroicons:calendar-days",
			category: "input",
		},

		// Selection fields
		{
			type: "dropdown",
			label: "רשימה נפתחת",
			icon: "heroicons:chevron-down",
			category: "selection",
		},
		{
			type: "radio",
			label: "בחירה בודדת",
			icon: "heroicons:check-circle",
			category: "selection",
		},
		{
			type: "checkbox",
			label: "תיבת סימון",
			icon: "heroicons:check",
			category: "selection",
		},
		{
			type: "checkboxes",
			label: "תיבות סימון",
			icon: "heroicons:list-bullet",
			category: "selection",
		},

		// Special fields
		{
			type: "signature",
			label: "חתימה",
			icon: "heroicons:pencil-square",
			category: "special",
		},
		{
			type: "repeater",
			label: "שדה חזרה",
			icon: "heroicons:arrows-pointing-out",
			category: "special",
		},

		// Layout elements
		{
			type: "heading_h1",
			label: "כותרת 1",
			icon: "heroicons:h1",
			category: "layout",
		},
		{
			type: "heading_h2",
			label: "כותרת 2",
			icon: "heroicons:h2",
			category: "layout",
		},
		{
			type: "heading_h3",
			label: "כותרת 3",
			icon: "heroicons:h3",
			category: "layout",
		},
		{
			type: "paragraph",
			label: "פסקה",
			icon: "heroicons:bars-3-bottom-left",
			category: "layout",
		},
		{
			type: "image",
			label: "תמונה",
			icon: "heroicons:photo",
			category: "layout",
		},
		{
			type: "video",
			label: "וידאו",
			icon: "heroicons:video-camera",
			category: "layout",
		},
		{
			type: "divider",
			label: "מפריד",
			icon: "heroicons:minus",
			category: "layout",
		},
		{
			type: "spacer",
			label: "מרווח",
			icon: "heroicons:arrows-up-down",
			category: "layout",
		},
		{
			type: "section",
			label: "מקטע",
			icon: "heroicons:rectangle-group",
			category: "layout",
		},
	];
}

// Group palette elements by category
export function useGroupedPaletteElements() {
	const elements = usePaletteElements();

	return {
		input: elements.filter((el) => el.category === "input"),
		selection: elements.filter((el) => el.category === "selection"),
		special: elements.filter((el) => el.category === "special"),
		layout: elements.filter((el) => el.category === "layout"),
	};
}

// Element component mapping
export function getElementComponent(type: ElementType): string | undefined {
	const componentMap: Record<ElementType, string | undefined> = {
		text: "InputElement",
		email: "InputElement",
		number: "InputElement",
		date: "InputElement",
		time: "InputElement",
		datetime: "InputElement",
		textarea: "TextareaElement",
		dropdown: "SelectionElement",
		radio: "SelectionElement",
		checkbox: "SelectionElement",
		checkboxes: "SelectionElement",
		signature: "SignatureElement",
		repeater: "RepeaterElement",
		heading_h1: "HeadingElement",
		heading_h2: "HeadingElement",
		heading_h3: "HeadingElement",
		paragraph: "ParagraphElement",
		image: "MediaElement",
		video: "MediaElement",
		divider: "DividerElement",
		spacer: "SpacerElement",
		section: "SectionElement",
	};

	return componentMap[type];
}

// Check if element type is a field (vs layout element)
export function isFieldElement(type: ElementType): boolean {
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
		"repeater",
	];
	return fieldTypes.includes(type);
}

// Check if element type stores submittable data (includes repeaters)
export function isSubmittableElement(type: ElementType): boolean {
	return isFieldElement(type) || type === "repeater";
}

// Check if element type supports validation
export function supportsValidation(type: ElementType): boolean {
	return isFieldElement(type);
}

// Check if element type has options (dropdown, radio, checkboxes)
export function hasOptions(type: ElementType): boolean {
	return ["dropdown", "radio", "checkboxes"].includes(type);
}
