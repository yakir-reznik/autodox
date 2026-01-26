import { H3Error, createError, getRouterParam, setResponseHeaders } from "h3";
import puppeteer from "puppeteer";

export default defineEventHandler(async (event) => {
	const browser = await puppeteer.launch({
		headless: true,
	});

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

		// Determine base URL (use runtime config or fallback to localhost)
		const baseUrl = process.env.BASE_URL || "http://localhost:3000";

		// Create new page and set authentication header
		const page = await browser.newPage();
		await page.setExtraHTTPHeaders({
			"X-Puppeteer-Secret": process.env.PUPPETEER_SECRET || "",
		});

		// Navigate to print view
		await page.goto(`${baseUrl}/print/${token}`, {
			waitUntil: "networkidle0",
		});

		// Generate PDF
		const pdfBuffer = await page.pdf({
			format: "A4",
			printBackground: true,
		});

		// Generate filename
		const filename = `submission-${token}-${new Date().toISOString().split("T")[0]}.pdf`;

		// Set response headers for PDF download
		setResponseHeaders(event, {
			"Content-Type": "application/pdf",
			"Content-Disposition": `attachment; filename="${filename}"`,
			"Cache-Control": "no-cache",
		});

		// Return the PDF buffer
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
	} finally {
		await browser.close();
	}
});
