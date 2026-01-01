import { db } from "~~/server/db";
import { formsTable, formElementsTable } from "~~/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const formId = Number(getRouterParam(event, "id"));

	if (isNaN(formId)) {
		throw createError({
			statusCode: 400,
			message: "Invalid form ID",
		});
	}

	// Check if form exists
	const form = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, formId),
	});

	if (!form) {
		throw createError({
			statusCode: 404,
			message: "Form not found",
		});
	}

	const body = await readBody(event);
	const { elements } = body;

	if (!Array.isArray(elements)) {
		throw createError({
			statusCode: 400,
			message: "Elements must be an array",
		});
	}

	// Get existing element IDs for this form
	const existingElements = await db.query.formElementsTable.findMany({
		where: and(
			eq(formElementsTable.formId, formId),
			eq(formElementsTable.isDeleted, false)
		),
	});
	const existingIds = new Set(existingElements.map((el) => el.id));

	// Track mapping from tempId to real ID
	const idMapping: Record<string, number> = {};

	// Separate elements into updates and inserts
	const toUpdate: typeof elements = [];
	const toInsert: typeof elements = [];
	const receivedIds = new Set<number>();

	for (const element of elements) {
		if (element.id && typeof element.id === "number") {
			receivedIds.add(element.id);
			toUpdate.push(element);
		} else {
			toInsert.push(element);
		}
	}

	// Mark removed elements as deleted (soft delete)
	const idsToDelete = [...existingIds].filter((id) => !receivedIds.has(id));
	if (idsToDelete.length > 0) {
		await db
			.update(formElementsTable)
			.set({ isDeleted: true })
			.where(
				and(
					eq(formElementsTable.formId, formId),
					inArray(formElementsTable.id, idsToDelete)
				)
			);
	}

	// First pass: Insert new elements (without parentId references to other new elements)
	// We need to handle parent references that point to tempIds
	const tempIdToElement = new Map<string, (typeof elements)[0]>();
	for (const element of toInsert) {
		if (element.tempId) {
			tempIdToElement.set(element.tempId, element);
		}
	}

	// Insert elements that have no parent or have a numeric parent (existing element)
	const insertedElements: Array<{ tempId: string; id: number }> = [];

	for (const element of toInsert) {
		const parentId =
			element.parentId === null
				? null
				: typeof element.parentId === "number"
					? element.parentId
					: idMapping[element.parentId] || null; // Reference to previously inserted element

		const result = await db.insert(formElementsTable).values({
			formId,
			type: element.type,
			position: element.position,
			parentId,
			name: element.name || null,
			config: element.config,
			isRequired: element.isRequired || false,
		});

		const insertId = result[0].insertId;

		if (element.tempId) {
			idMapping[element.tempId] = insertId;
			insertedElements.push({ tempId: element.tempId, id: insertId });
		}
	}

	// Update existing elements
	for (const element of toUpdate) {
		const parentId =
			element.parentId === null
				? null
				: typeof element.parentId === "number"
					? element.parentId
					: idMapping[element.parentId] || null;

		await db
			.update(formElementsTable)
			.set({
				type: element.type,
				position: element.position,
				parentId,
				name: element.name || null,
				config: element.config,
				isRequired: element.isRequired || false,
			})
			.where(eq(formElementsTable.id, element.id));
	}

	// Fetch updated elements
	const updatedElements = await db.query.formElementsTable.findMany({
		where: and(
			eq(formElementsTable.formId, formId),
			eq(formElementsTable.isDeleted, false)
		),
		orderBy: (elements, { asc }) => [asc(elements.position)],
	});

	return {
		elements: updatedElements,
		mapping: idMapping,
	};
});
