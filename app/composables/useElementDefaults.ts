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
				label: "Text Field",
				placeholder: "",
				helpText: "",
				validation: { required: false },
			};
		case "email":
			return {
				label: "Email",
				placeholder: "example@email.com",
				helpText: "",
				validation: { required: false },
			};
		case "number":
			return {
				label: "Number",
				placeholder: "",
				helpText: "",
				validation: { required: false },
				step: 1,
			};
		case "textarea":
			return {
				label: "Text Area",
				placeholder: "",
				helpText: "",
				rows: 4,
				validation: { required: false },
			};
		case "date":
			return {
				label: "Date",
				placeholder: "",
				helpText: "",
				validation: { required: false },
			};
		case "time":
			return {
				label: "Time",
				placeholder: "",
				helpText: "",
				validation: { required: false },
			};
		case "datetime":
			return {
				label: "Date & Time",
				placeholder: "",
				helpText: "",
				validation: { required: false },
			};

		// Selection fields
		case "dropdown":
			return {
				label: "Dropdown",
				placeholder: "Select an option",
				helpText: "",
				options: [
					{ id: "opt1", label: "Option 1", value: "option1" },
					{ id: "opt2", label: "Option 2", value: "option2" },
				],
				validation: { required: false },
			};
		case "radio":
			return {
				label: "Radio Buttons",
				helpText: "",
				options: [
					{ id: "opt1", label: "Option 1", value: "option1" },
					{ id: "opt2", label: "Option 2", value: "option2" },
				],
				validation: { required: false },
			};
		case "checkbox":
			return {
				label: "Checkbox",
				helpText: "",
				validation: { required: false },
			};
		case "checkboxes":
			return {
				label: "Checkboxes",
				helpText: "",
				options: [
					{ id: "opt1", label: "Option 1", value: "option1" },
					{ id: "opt2", label: "Option 2", value: "option2" },
				],
				validation: { required: false },
			};

		// Special fields
		case "signature":
			return {
				label: "Signature",
				helpText: "Draw your signature",
				maxWidth: 400,
				maxHeight: 200,
				validation: { required: false },
			};

		// Layout elements
		case "heading_h1":
			return {
				text: "Heading",
				align: "right",
			};
		case "heading_h2":
			return {
				text: "Subheading",
				align: "right",
			};
		case "heading_h3":
			return {
				text: "Section Title",
				align: "right",
			};
		case "paragraph":
			return {
				text: "Enter your text here...",
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
				title: "Section",
				description: "",
				collapsible: false,
				defaultCollapsed: false,
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
			label: "Text",
			icon: "heroicons:pencil",
			category: "input",
		},
		{
			type: "email",
			label: "Email",
			icon: "heroicons:envelope",
			category: "input",
		},
		{
			type: "number",
			label: "Number",
			icon: "heroicons:hashtag",
			category: "input",
		},
		{
			type: "textarea",
			label: "Text Area",
			icon: "heroicons:document-text",
			category: "input",
		},
		{
			type: "date",
			label: "Date",
			icon: "heroicons:calendar",
			category: "input",
		},
		{
			type: "time",
			label: "Time",
			icon: "heroicons:clock",
			category: "input",
		},
		{
			type: "datetime",
			label: "Date & Time",
			icon: "heroicons:calendar-days",
			category: "input",
		},

		// Selection fields
		{
			type: "dropdown",
			label: "Dropdown",
			icon: "heroicons:chevron-down",
			category: "selection",
		},
		{
			type: "radio",
			label: "Radio",
			icon: "heroicons:check-circle",
			category: "selection",
		},
		{
			type: "checkbox",
			label: "Checkbox",
			icon: "heroicons:check",
			category: "selection",
		},
		{
			type: "checkboxes",
			label: "Checkboxes",
			icon: "heroicons:list-bullet",
			category: "selection",
		},

		// Special fields
		{
			type: "signature",
			label: "Signature",
			icon: "heroicons:pencil-square",
			category: "special",
		},

		// Layout elements
		{
			type: "heading_h1",
			label: "Heading 1",
			icon: "heroicons:h1",
			category: "layout",
		},
		{
			type: "heading_h2",
			label: "Heading 2",
			icon: "heroicons:h2",
			category: "layout",
		},
		{
			type: "heading_h3",
			label: "Heading 3",
			icon: "heroicons:h3",
			category: "layout",
		},
		{
			type: "paragraph",
			label: "Paragraph",
			icon: "heroicons:bars-3-bottom-left",
			category: "layout",
		},
		{
			type: "image",
			label: "Image",
			icon: "heroicons:photo",
			category: "layout",
		},
		{
			type: "video",
			label: "Video",
			icon: "heroicons:video-camera",
			category: "layout",
		},
		{
			type: "divider",
			label: "Divider",
			icon: "heroicons:minus",
			category: "layout",
		},
		{
			type: "spacer",
			label: "Spacer",
			icon: "heroicons:arrows-up-down",
			category: "layout",
		},
		{
			type: "section",
			label: "Section",
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
	];
	return fieldTypes.includes(type);
}

// Check if element type supports validation
export function supportsValidation(type: ElementType): boolean {
	return isFieldElement(type);
}

// Check if element type has options (dropdown, radio, checkboxes)
export function hasOptions(type: ElementType): boolean {
	return ["dropdown", "radio", "checkboxes"].includes(type);
}
