import { H3Error, createError, getRouterParam, setResponseHeaders } from "h3";
import { generateSubmissionPDF } from "~~/server/utils/generatePDF";

export default defineEventHandler(async (event) => {
	try {
		const token = getRouterParam(event, "token");

		if (!token) {
			throw createError({
				statusCode: 400,
				message: "Submission token is required",
			});
		}

		// Check if user is authenticated and is an admin
		const { user } = await requireUserSession(event);

		if (user.role !== "admin") {
			throw createError({
				statusCode: 403,
				message: "Only admin users can download submission PDFs",
			});
		}

		// Generate PDF (async operation)
		const pdfDoc = await generateSubmissionPDF(token);

		// Generate filename
		const filename = `submission-${token}-${new Date().toISOString().split("T")[0]}.pdf`;

		// Set response headers for PDF download
		setResponseHeaders(event, {
			"Content-Type": "application/pdf",
			"Content-Disposition": `attachment; filename="${filename}"`,
			"Cache-Control": "no-cache",
		});

		// Return the PDF stream
		return pdfDoc;
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
