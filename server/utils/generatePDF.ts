import { db } from "~~/server/db";
import { submissionsTable, formEntrancesTable, formsTable } from "~~/server/db/schema";
import { eq, asc } from "drizzle-orm";
import { createError } from "h3";
import PDFDocument from "pdfkit";
import type { SubmissionStatus, DeviceType } from "~~/server/db/schema";

/**
 * Submission data structure for PDF generation
 */
export interface SubmissionData {
	submission: {
		id: number;
		token: string;
		formId: number;
		prefillData: Record<string, unknown> | null;
		additionalData: Record<string, unknown> | null;
		createdByUserId: number | null;
		expiresAt: Date;
		status: SubmissionStatus;
		submissionData: Record<string, unknown> | null;
		createdAt: Date;
		startedAt: Date | null;
		submittedAt: Date | null;
		lockedAt: Date | null;
	};
	form?: {
		id: number;
		title: string;
		description: string | null;
		status: string;
		theme: string;
		createdBy: number;
		updatedBy: number | null;
		createdAt: Date;
		updatedAt: Date;
	};
	entrances: Array<{
		id: number;
		sessionToken: string | null;
		formId: number;
		ipAddress: string | null;
		userAgent: string | null;
		referrer: string | null;
		isFormLocked: boolean;
		isNewSession: boolean;
		country: string | null;
		deviceType: DeviceType | null;
		browserName: string | null;
		osName: string | null;
		metadata: Record<string, any> | null;
		timestamp: Date;
		createdAt: Date;
	}>;
}

/**
 * Fetches submission data from the database
 * @param token - The submission token
 * @returns Submission data with form and entrances
 */
async function getSubmissionData(token: string): Promise<SubmissionData> {
	// Find the submission by token
	const [submission] = await db
		.select()
		.from(submissionsTable)
		.where(eq(submissionsTable.token, token))
		.limit(1);

	if (!submission) {
		throw createError({
			statusCode: 404,
			message: "Submission not found",
		});
	}

	// Get the form details
	const form = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, submission.formId),
	});

	// Get all form entrances for this specific submission (by token)
	const entrances = await db
		.select()
		.from(formEntrancesTable)
		.where(eq(formEntrancesTable.sessionToken, token))
		.orderBy(formEntrancesTable.timestamp);

	return {
		submission,
		form,
		entrances,
	};
}

/**
 * Generates a readable PDF document from submission token
 * @param token - The submission token
 * @returns PDFKit document stream
 */
export async function generateSubmissionPDF(token: string): Promise<PDFKit.PDFDocument> {
	// Fetch submission data
	const data = await getSubmissionData(token);
	const doc = new PDFDocument({
		size: "A4",
		margins: {
			top: 50,
			bottom: 50,
			left: 50,
			right: 50,
		},
		info: {
			Title: `Submission ${data.submission.token}`,
			Author: "Autodox",
			Subject: `Form Submission Report`,
			CreationDate: new Date(),
		},
	});

	const colors = {
		primary: "#2563eb", // blue-600
		secondary: "#64748b", // slate-500
		success: "#22c55e", // green-500
		warning: "#f59e0b", // amber-500
		danger: "#ef4444", // red-500
		text: "#1e293b", // slate-800
		muted: "#94a3b8", // slate-400
		border: "#e2e8f0", // slate-200
	};

	let yPosition = doc.y;

	// Helper function to draw a horizontal line
	const drawLine = (y: number) => {
		doc.strokeColor(colors.border).lineWidth(1).moveTo(50, y).lineTo(545, y).stroke();
	};

	// Helper function to add section header
	const addSectionHeader = (title: string) => {
		yPosition = doc.y + 20;
		if (yPosition > 700) {
			doc.addPage();
			yPosition = 50;
		}
		doc.fillColor(colors.primary)
			.fontSize(16)
			.font("Helvetica-Bold")
			.text(title, 50, yPosition);
		yPosition += 25;
		drawLine(yPosition);
		yPosition += 15;
		doc.fillColor(colors.text);
	};

	// Helper function to add a field
	const addField = (label: string, value: string, valueColor: string = colors.text) => {
		if (yPosition > 720) {
			doc.addPage();
			yPosition = 50;
		}
		doc.fillColor(colors.secondary)
			.fontSize(10)
			.font("Helvetica-Bold")
			.text(label + ":", 50, yPosition, { width: 150, continued: false });

		doc.fillColor(valueColor)
			.fontSize(10)
			.font("Helvetica")
			.text(value, 210, yPosition, { width: 335 });

		yPosition += 20;
	};

	// Helper function to format date
	const formatDate = (date: Date | null | undefined): string => {
		if (!date) return "N/A";
		return new Date(date).toLocaleString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	};

	// Helper function to get status color
	const getStatusColor = (status: SubmissionStatus): string => {
		switch (status) {
			case "submitted":
			case "locked":
				return colors.success;
			case "in_progress":
				return colors.warning;
			case "pending":
				return colors.secondary;
			default:
				return colors.text;
		}
	};

	// ========================================
	// HEADER
	// ========================================
	doc.fillColor(colors.primary)
		.fontSize(24)
		.font("Helvetica-Bold")
		.text("Form Submission Report", 50, 50);

	yPosition = 80;
	doc.fillColor(colors.muted)
		.fontSize(10)
		.font("Helvetica")
		.text(`Generated on ${formatDate(new Date())}`, 50, yPosition);

	yPosition = 110;
	drawLine(yPosition);
	yPosition += 20;

	// ========================================
	// SUBMISSION OVERVIEW
	// ========================================
	doc.fillColor(colors.primary)
		.fontSize(18)
		.font("Helvetica-Bold")
		.text("Submission Overview", 50, yPosition);
	yPosition += 30;

	addField("Submission ID", `#${data.submission.id}`);
	addField("Token", data.submission.token);
	addField(
		"Status",
		data.submission.status.toUpperCase(),
		getStatusColor(data.submission.status)
	);

	if (data.form) {
		addField("Form Title", data.form.title);
		if (data.form.description) {
			addField("Form Description", data.form.description);
		}
	}

	// ========================================
	// TIMELINE
	// ========================================
	addSectionHeader("Submission Timeline");

	addField("Created", formatDate(data.submission.createdAt));
	if (data.submission.startedAt) {
		addField("Started", formatDate(data.submission.startedAt));
	}
	if (data.submission.submittedAt) {
		addField("Submitted", formatDate(data.submission.submittedAt));
	}
	if (data.submission.lockedAt) {
		addField("Locked", formatDate(data.submission.lockedAt));
	}
	if (data.submission.expiresAt) {
		const isExpired = new Date(data.submission.expiresAt) < new Date();
		addField(
			"Expires",
			formatDate(data.submission.expiresAt),
			isExpired ? colors.danger : colors.text
		);
	}

	// ========================================
	// SUBMISSION DATA
	// ========================================
	if (data.submission.submissionData && Object.keys(data.submission.submissionData).length > 0) {
		addSectionHeader("Submitted Data");

		Object.entries(data.submission.submissionData).forEach(([key, value]) => {
			const displayValue =
				typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
			addField(key, displayValue);
		});
	}

	// ========================================
	// PREFILL DATA
	// ========================================
	if (data.submission.prefillData && Object.keys(data.submission.prefillData).length > 0) {
		addSectionHeader("Prefill Data");

		Object.entries(data.submission.prefillData).forEach(([key, value]) => {
			const displayValue =
				typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
			addField(key, displayValue);
		});
	}

	// ========================================
	// ADDITIONAL DATA
	// ========================================
	if (data.submission.additionalData && Object.keys(data.submission.additionalData).length > 0) {
		addSectionHeader("Additional Data");

		Object.entries(data.submission.additionalData).forEach(([key, value]) => {
			const displayValue =
				typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
			addField(key, displayValue);
		});
	}

	// ========================================
	// ENTRANCE ANALYTICS
	// ========================================
	if (data.entrances && data.entrances.length > 0) {
		addSectionHeader("Entrance Analytics");

		addField("Total Entrances", data.entrances.length.toString(), colors.primary);

		// Calculate unique sessions
		const uniqueSessions = new Set(data.entrances.map((e) => e.sessionToken).filter(Boolean));
		addField("Unique Sessions", uniqueSessions.size.toString());

		// Count new sessions
		const newSessions = data.entrances.filter((e) => e.isNewSession).length;
		addField("New Sessions", newSessions.toString());

		// Count locked form views
		const lockedViews = data.entrances.filter((e) => e.isFormLocked).length;
		if (lockedViews > 0) {
			addField("Locked Form Views", lockedViews.toString(), colors.warning);
		}

		// Device breakdown
		const deviceCounts: Record<string, number> = {};
		data.entrances.forEach((e) => {
			const device = e.deviceType || "unknown";
			deviceCounts[device] = (deviceCounts[device] || 0) + 1;
		});

		if (Object.keys(deviceCounts).length > 0) {
			yPosition += 10;
			doc.fillColor(colors.secondary)
				.fontSize(10)
				.font("Helvetica-Bold")
				.text("Device Breakdown:", 50, yPosition);
			yPosition += 20;

			Object.entries(deviceCounts).forEach(([device, count]) => {
				doc.fillColor(colors.text)
					.fontSize(10)
					.font("Helvetica")
					.text(`• ${device}: ${count}`, 70, yPosition);
				yPosition += 18;
			});
		}

		// Country breakdown
		const countryCounts: Record<string, number> = {};
		data.entrances.forEach((e) => {
			if (e.country) {
				countryCounts[e.country] = (countryCounts[e.country] || 0) + 1;
			}
		});

		if (Object.keys(countryCounts).length > 0) {
			yPosition += 10;
			doc.fillColor(colors.secondary)
				.fontSize(10)
				.font("Helvetica-Bold")
				.text("Country Breakdown:", 50, yPosition);
			yPosition += 20;

			Object.entries(countryCounts).forEach(([country, count]) => {
				doc.fillColor(colors.text)
					.fontSize(10)
					.font("Helvetica")
					.text(`• ${country}: ${count}`, 70, yPosition);
				yPosition += 18;
			});
		}

		// ========================================
		// DETAILED ENTRANCE LOG
		// ========================================
		addSectionHeader("Detailed Entrance Log");

		data.entrances.forEach((entrance, index) => {
			// Check if we need a new page
			if (yPosition > 650) {
				doc.addPage();
				yPosition = 50;
			}

			doc.fillColor(colors.primary)
				.fontSize(11)
				.font("Helvetica-Bold")
				.text(`Entrance #${index + 1}`, 50, yPosition);
			yPosition += 20;

			addField("Timestamp", formatDate(entrance.timestamp));

			if (entrance.ipAddress) {
				addField("IP Address", entrance.ipAddress);
			}

			if (entrance.deviceType) {
				addField("Device Type", entrance.deviceType);
			}

			if (entrance.browserName) {
				addField("Browser", entrance.browserName);
			}

			if (entrance.osName) {
				addField("Operating System", entrance.osName);
			}

			if (entrance.country) {
				addField("Country", entrance.country);
			}

			if (entrance.referrer) {
				addField("Referrer", entrance.referrer);
			}

			if (entrance.userAgent) {
				if (yPosition > 700) {
					doc.addPage();
					yPosition = 50;
				}
				doc.fillColor(colors.secondary)
					.fontSize(8)
					.font("Helvetica")
					.text(`User Agent: ${entrance.userAgent}`, 50, yPosition, { width: 495 });
				yPosition += 15;
			}

			if (entrance.metadata && Object.keys(entrance.metadata).length > 0) {
				yPosition += 5;
				doc.fillColor(colors.secondary)
					.fontSize(9)
					.font("Helvetica-Bold")
					.text("Metadata:", 50, yPosition);
				yPosition += 15;

				Object.entries(entrance.metadata).forEach(([key, value]) => {
					const displayValue =
						typeof value === "object" ? JSON.stringify(value) : String(value);
					doc.fillColor(colors.text)
						.fontSize(8)
						.font("Helvetica")
						.text(`• ${key}: ${displayValue}`, 70, yPosition, { width: 475 });
					yPosition += 12;
				});
			}

			// Add spacing between entrances
			yPosition += 10;
			if (index < data.entrances.length - 1) {
				drawLine(yPosition);
				yPosition += 15;
			}
		});
	}

	// ========================================
	// FOOTER
	// ========================================
	const pages = doc.bufferedPageRange();
	for (let i = 0; i < pages.count; i++) {
		doc.switchToPage(pages.start + i);
		doc.fillColor(colors.muted)
			.fontSize(8)
			.text(`Page ${i + 1} of ${pages.count}`, 50, 770, {
				align: "center",
				width: 495,
			});
	}

	// Finalize the document
	doc.end();

	return doc;
}
