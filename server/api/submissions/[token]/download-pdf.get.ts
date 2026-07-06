import { H3Error, createError, getRouterParam, setResponseHeaders } from "h3";
import { queuePDFGeneration } from "~~/server/utils/pdfQueue";
import { requireSubmissionPermission } from "~~/server/utils/authorization";
import { db } from "~~/server/db";
import { formsTable, submissionsTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const token = getRouterParam(event, "token");

	if (!token) {
		throw createError({
			statusCode: 400,
			message: "Submission token is required",
		});
	}

	const submission = await db.query.submissionsTable.findFirst({
		where: eq(submissionsTable.token, token),
	});

	if (!submission) {
		throw createError({
			statusCode: 404,
			message: "Submission not found",
		});
	}

	const form = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, submission.formId),
	});

	if (!form) {
		throw createError({
			statusCode: 404,
			message: "Form not found",
		});
	}

	const { allowPdfDownload } = resolveFormSettings(form, submission);

	if (submission.status !== "locked" || !allowPdfDownload) {
		await requireSubmissionPermission(event, token, "view_submissions");
	}

	try {
		const pdfBuffer = await queuePDFGeneration(token);

		// Generate filename
		const filename = `submission-${token}-${new Date().toISOString().split("T")[0]}.pdf`;

		// Set response headers for PDF download
		setResponseHeaders(event, {
			"Content-Type": "application/pdf",
			"Content-Disposition": `attachment; filename="${filename}"`,
			"Cache-Control": "no-cache",
		});

		return pdfBuffer;
	} catch (error) {
		if (error instanceof H3Error) {
			throw error;
		}
		console.error("Error generating PDF:", error);
		throw createError({
			statusCode: 500,
			message: "Failed to generate PDF",
		});
	}
});
