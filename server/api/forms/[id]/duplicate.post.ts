import { db } from "~~/server/db";
import { formsTable, formElementsTable } from "~~/server/db/schema";
import { eq, asc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const id = Number(getRouterParam(event, "id"));

	if (isNaN(id)) {
		throw createError({
			statusCode: 400,
			message: "Invalid form ID",
		});
	}

	const body = await readBody(event);

	if (!body.createdBy) {
		throw createError({
			statusCode: 400,
			message: "createdBy is required",
		});
	}

	const sourceForm = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, id),
		with: {
			elements: {
				where: eq(formElementsTable.isDeleted, false),
				orderBy: [asc(formElementsTable.position)],
			},
		},
	});

	if (!sourceForm) {
		throw createError({
			statusCode: 404,
			message: "Form not found",
		});
	}

	// Create the duplicated form
	const result = await db.insert(formsTable).values({
		title: `${sourceForm.title} (העתק)`,
		description: sourceForm.description,
		folderId: sourceForm.folderId,
		status: "draft",
		theme: sourceForm.theme,
		webhookUrl: sourceForm.webhookUrl,
		webhookIncludePdf: sourceForm.webhookIncludePdf,
		allowPublicSubmissions: sourceForm.allowPublicSubmissions,
		createdBy: body.createdBy,
	});

	const newFormId = result[0].insertId;

	// Copy elements in two passes to correctly remap parentId references
	// regardless of the order elements appear relative to their parents.
	if (sourceForm.elements.length > 0) {
		const oldIdToNewId = new Map<number, number>();

		// Pass 1: insert all elements without parentId
		for (const element of sourceForm.elements) {
			const insertResult = await db.insert(formElementsTable).values({
				formId: newFormId,
				type: element.type,
				position: element.position,
				parentId: null,
				name: element.name,
				config: element.config,
				isDeleted: false,
			});

			oldIdToNewId.set(element.id, insertResult[0].insertId);
		}

		// Pass 2: update parentId references using the remapped IDs
		for (const element of sourceForm.elements) {
			if (element.parentId !== null) {
				const newId = oldIdToNewId.get(element.id)!;
				const newParentId = oldIdToNewId.get(element.parentId) ?? null;
				await db
					.update(formElementsTable)
					.set({ parentId: newParentId })
					.where(eq(formElementsTable.id, newId));
			}
		}
	}

	const newForm = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, newFormId),
	});

	return newForm;
});
