import { db } from "~~/server/db";
import { formsTable, formElementsTable } from "~~/server/db/schema";
import { eq, asc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event);
	if (!session.user) {
		throw createError({ statusCode: 401, message: "Authentication required" });
	}

	const id = Number(getRouterParam(event, "id"));
	if (isNaN(id)) {
		throw createError({ statusCode: 400, message: "Invalid form ID" });
	}

	const form = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, id),
		with: {
			elements: {
				where: eq(formElementsTable.isDeleted, false),
				orderBy: [asc(formElementsTable.position)],
			},
		},
	});

	if (!form) {
		throw createError({ statusCode: 404, message: "Form not found" });
	}

	if (form.createdBy !== session.user.id) {
		throw createError({ statusCode: 403, message: "Not authorized" });
	}

	type DbElement = (typeof form.elements)[number];

	function elementToUpload(el: DbElement, allElements: DbElement[]): Record<string, unknown> {
		const config = el.config as Record<string, any>;
		const out: Record<string, unknown> = { type: el.type };

		if (el.name) out.id = el.name;

		const label = config.label ?? config.title;
		if (label) out.label = label;

		if (config.placeholder) out.placeholder = config.placeholder;
		if (config.helpText) out.helpText = config.helpText;
		if (el.isRequired) out.required = true;

		if (config.options) out.options = config.options.map((o: any) => o.label);
		if (config.allowOther) out.allowOther = config.allowOther;

		if (config.text) out.text = config.text;
		if (config.align) out.align = config.align;

		if (config.url !== undefined) out.url = config.url;
		if (config.caption) out.caption = config.caption;

		if (el.type === "spacer" && config.height !== undefined) out.height = config.height;
		if (config.style) out.style = config.style;
		if (config.step !== undefined) out.step = config.step;
		if (config.rows !== undefined) out.rows = config.rows;
		if (config.defaultValue !== undefined) out.defaultValue = config.defaultValue;
		if (config.autocomplete) out.autocomplete = config.autocomplete;

		if (el.type === "repeater") {
			if (config.minItems !== undefined) out.minItems = config.minItems;
			if (config.maxItems !== undefined) out.maxItems = config.maxItems;
			if (config.addButtonText) out.addButtonText = config.addButtonText;
		}

		if (el.type === "section" || el.type === "repeater") {
			const children = allElements
				.filter((child) => child.parentId === el.id)
				.sort((a, b) => parseFloat(a.position) - parseFloat(b.position));
			if (children.length > 0) {
				out.children = children.map((child) => elementToUpload(child, allElements));
			}
		}

		return out;
	}

	const topLevel = form.elements
		.filter((el) => el.parentId === null)
		.sort((a, b) => parseFloat(a.position) - parseFloat(b.position));

	return {
		title: form.title,
		...(form.description ? { description: form.description } : {}),
		elements: topLevel.map((el) => elementToUpload(el, form.elements)),
	};
});
