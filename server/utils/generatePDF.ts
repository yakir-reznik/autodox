import { db } from "~~/server/db";
import {
	submissionsTable,
	formEntrancesTable,
	formsTable,
	formElementsTable,
} from "~~/server/db/schema";
import { eq } from "drizzle-orm";
import { createError } from "h3";
import type { SubmissionStatus, DeviceType } from "~~/server/db/schema";
import path from "path";
import fs from "fs";
import { jsPDF } from "jspdf";

/**
 * Helper function to check if text contains Hebrew characters
 */
function containsHebrew(text: string): boolean {
	const hebrewRegex = /[\u0590-\u05FF]/;
	return hebrewRegex.test(text);
}

/**
 * Helper function to reverse text for RTL display in jsPDF
 * Only reverses if text contains Hebrew characters
 */
function reverseText(text: string): string {
	if (!text) return text;
	// Always reverse - used for labels and static Hebrew text
	return text.split("").reverse().join("");
}

/**
 * Smart reversal for values that might be Hebrew, English, or mixed
 */
function smartReverse(text: string): string {
	if (!text) return text;

	// If text contains Hebrew, reverse it
	// Otherwise return as-is (for English text, numbers, etc.)
	if (containsHebrew(text)) {
		return text.split("").reverse().join("");
	}
	return text;
}

/**
 * Helper function to check if a string is a base64 image
 */
function isBase64Image(str: string): boolean {
	if (typeof str !== "string") return false;
	const dataUrlPattern = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/;
	return dataUrlPattern.test(str);
}

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
	formElements?: Array<{
		id: number;
		name: string | null;
		type: string;
		config: any;
	}>;
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
 */
async function getSubmissionData(token: string): Promise<SubmissionData> {
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

	const form = await db.query.formsTable.findFirst({
		where: eq(formsTable.id, submission.formId),
	});

	const formElements = await db.query.formElementsTable.findMany({
		where: eq(formElementsTable.formId, submission.formId),
		columns: {
			id: true,
			name: true,
			type: true,
			config: true,
		},
	});

	const entrances = await db
		.select()
		.from(formEntrancesTable)
		.where(eq(formEntrancesTable.sessionToken, token));

	return {
		submission,
		form,
		formElements,
		entrances,
	};
}

/**
 * Load Hebrew font and register it with jsPDF
 */
function registerHebrewFont(doc: jsPDF): boolean {
	try {
		const fontPath = path.join(
			process.cwd(),
			"fonts",
			"Noto_Sans_Hebrew",
			"NotoSansHebrew-Regular.ttf"
		);
		const fontBoldPath = path.join(
			process.cwd(),
			"fonts",
			"Noto_Sans_Hebrew",
			"NotoSansHebrew-Bold.ttf"
		);

		if (fs.existsSync(fontPath) && fs.existsSync(fontBoldPath)) {
			// Read font files as base64
			const fontBase64 = fs.readFileSync(fontPath).toString("base64");
			const fontBoldBase64 = fs.readFileSync(fontBoldPath).toString("base64");

			// Add fonts to jsPDF
			doc.addFileToVFS("NotoSansHebrew-Regular.ttf", fontBase64);
			doc.addFont("NotoSansHebrew-Regular.ttf", "NotoSansHebrew", "normal");

			doc.addFileToVFS("NotoSansHebrew-Bold.ttf", fontBoldBase64);
			doc.addFont("NotoSansHebrew-Bold.ttf", "NotoSansHebrew", "bold");

			return true;
		}
		return false;
	} catch (err) {
		console.error("Failed to register Hebrew font:", err);
		return false;
	}
}

/**
 * Generates a readable PDF document from submission token
 */
export async function generateSubmissionPDF(token: string): Promise<Buffer> {
	const data = await getSubmissionData(token);

	// Create PDF document
	const doc = new jsPDF({
		orientation: "portrait",
		unit: "mm",
		format: "a4",
	});

	// Register Hebrew font
	const hebrewFontRegistered = registerHebrewFont(doc);
	if (hebrewFontRegistered) {
		doc.setFont("NotoSansHebrew", "normal");
		doc.setLanguage("he");
	}

	// Colors
	const colors = {
		primary: [37, 99, 235], // blue-600
		secondary: [100, 116, 139], // slate-500
		success: [34, 197, 94], // green-500
		warning: [245, 158, 11], // amber-500
		danger: [239, 68, 68], // red-500
		text: [30, 41, 59], // slate-800
		muted: [148, 163, 184], // slate-400
		border: [226, 232, 240], // slate-200
	};

	let yPosition = 20;
	const pageWidth = 210; // A4 width in mm
	const pageHeight = 297; // A4 height in mm
	const margin = 20;
	const contentWidth = pageWidth - 2 * margin;

	// Helper to get field label
	const getFieldLabel = (fieldName: string): string => {
		if (!data.formElements) return fieldName;
		const element = data.formElements.find((el) => el.name === fieldName);
		return element?.config?.label || fieldName;
	};

	// Helper to format date
	const formatDate = (date: Date | null | undefined): string => {
		if (!date) return reverseText("לא זמין");
		const d = new Date(date);
		const day = String(d.getDate()).padStart(2, "0");
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const year = d.getFullYear();
		const hours = String(d.getHours()).padStart(2, "0");
		const minutes = String(d.getMinutes()).padStart(2, "0");
		// Return in dd/mm/yyyy hh:mm format - no reversal needed
		return `${day}/${month}/${year} ${hours}:${minutes}`;
	};

	// Helper to add new page if needed
	const checkNewPage = (requiredSpace: number = 20) => {
		if (yPosition + requiredSpace > pageHeight - margin) {
			doc.addPage();
			yPosition = margin;
		}
	};

	// Helper to draw line
	const drawLine = () => {
		doc.setDrawColor(...colors.border);
		doc.setLineWidth(0.5);
		doc.line(margin, yPosition, pageWidth - margin, yPosition);
		yPosition += 5;
	};

	// Helper to add section header
	const addSectionHeader = (title: string) => {
		checkNewPage(15);
		yPosition += 8; // Add spacing before section
		doc.setFontSize(16);
		doc.setFont("NotoSansHebrew", "bold");
		doc.setTextColor(...colors.primary);
		doc.text(reverseText(title), pageWidth - margin, yPosition, { align: "right" });
		yPosition += 8;
		drawLine();
		doc.setTextColor(...colors.text);
		doc.setFont("NotoSansHebrew", "normal");
	};

	// Helper to add field
	const addField = (label: string, value: string, color: number[] = colors.text) => {
		checkNewPage(10);
		doc.setFontSize(10);

		// Label - always reverse (Hebrew labels)
		doc.setFont("NotoSansHebrew", "bold");
		doc.setTextColor(...colors.secondary);
		doc.text(reverseText(label), pageWidth - margin, yPosition, { align: "right" });

		// Value - use smart reversal (might be Hebrew, English, or mixed)
		doc.setFont("NotoSansHebrew", "normal");
		doc.setTextColor(...color);
		const processedValue = smartReverse(value);
		const lines = doc.splitTextToSize(processedValue, contentWidth * 0.6);
		doc.text(lines, pageWidth - margin - 50, yPosition, { align: "right" });

		yPosition += Math.max(7, lines.length * 5);
	};

	// Helper to add image
	const addImage = (label: string, base64Data: string) => {
		checkNewPage(60);
		doc.setFontSize(10);
		doc.setFont("NotoSansHebrew", "bold");
		doc.setTextColor(...colors.secondary);
		doc.text(reverseText(label) + ":", pageWidth - margin, yPosition, { align: "right" });
		yPosition += 7;

		try {
			// Add image
			doc.addImage(base64Data, "PNG", margin, yPosition, 80, 40);
			yPosition += 45;
		} catch (err) {
			console.error("Failed to add image:", err);
			doc.setTextColor(...colors.danger);
			doc.text(reverseText("שגיאה בטעינת תמונה"), pageWidth - margin, yPosition, {
				align: "right",
			});
			yPosition += 7;
		}
	};

	// ===========================================
	// HEADER
	// ===========================================
	doc.setFontSize(24);
	doc.setFont("NotoSansHebrew", "bold");
	doc.setTextColor(...colors.primary);
	doc.text(reverseText("דוח הגשת טופס"), pageWidth - margin, yPosition, { align: "right" });
	yPosition += 10;

	doc.setFontSize(10);
	doc.setFont("NotoSansHebrew", "normal");
	doc.setTextColor(...colors.muted);
	doc.text(reverseText(`נוצר בתאריך ${formatDate(new Date())}`), pageWidth - margin, yPosition, {
		align: "right",
	});
	yPosition += 10;

	drawLine();
	yPosition += 5;

	// ===========================================
	// SUBMISSION OVERVIEW
	// ===========================================
	doc.setFontSize(18);
	doc.setFont("NotoSansHebrew", "bold");
	doc.setTextColor(...colors.primary);
	doc.text(reverseText("סקירת הגשה"), pageWidth - margin, yPosition, { align: "right" });
	yPosition += 10;

	addField("מזהה הגשה", `#${data.submission.id}`);
	addField("טוקן", data.submission.token);

	const statusHebrew: Record<string, string> = {
		pending: "ממתין",
		in_progress: "בתהליך",
		submitted: "הוגש",
		locked: "נעול",
	};
	const statusColor =
		data.submission.status === "submitted" || data.submission.status === "locked"
			? colors.success
			: data.submission.status === "in_progress"
			? colors.warning
			: colors.secondary;

	addField("סטטוס", statusHebrew[data.submission.status] || data.submission.status, statusColor);

	if (data.form) {
		addField("שם הטופס", data.form.title);
		if (data.form.description) {
			addField("תיאור הטופס", data.form.description);
		}
	}

	// ===========================================
	// TIMELINE
	// ===========================================
	addSectionHeader("ציר זמן");

	addField("נוצר", formatDate(data.submission.createdAt));
	if (data.submission.startedAt) {
		addField("התחיל", formatDate(data.submission.startedAt));
	}
	if (data.submission.submittedAt) {
		addField("הוגש", formatDate(data.submission.submittedAt));
	}
	if (data.submission.lockedAt) {
		addField("ננעל", formatDate(data.submission.lockedAt));
	}
	if (data.submission.expiresAt) {
		const isExpired = new Date(data.submission.expiresAt) < new Date();
		addField(
			"תפוגה",
			formatDate(data.submission.expiresAt),
			isExpired ? colors.danger : colors.text
		);
	}

	// ===========================================
	// SUBMISSION DATA
	// ===========================================
	if (data.submission.submissionData && Object.keys(data.submission.submissionData).length > 0) {
		addSectionHeader("נתוני הגשה");

		Object.entries(data.submission.submissionData).forEach(([key, value]) => {
			const fieldLabel = getFieldLabel(key);
			if (typeof value === "string" && isBase64Image(value)) {
				addImage(fieldLabel, value);
			} else {
				const displayValue =
					typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
				addField(fieldLabel, displayValue);
			}
		});
	}

	// ===========================================
	// PREFILL DATA
	// ===========================================
	if (data.submission.prefillData && Object.keys(data.submission.prefillData).length > 0) {
		addSectionHeader("נתוני מילוי מראש");

		Object.entries(data.submission.prefillData).forEach(([key, value]) => {
			const fieldLabel = getFieldLabel(key);
			if (typeof value === "string" && isBase64Image(value)) {
				addImage(fieldLabel, value);
			} else {
				const displayValue =
					typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
				addField(fieldLabel, displayValue);
			}
		});
	}

	// ===========================================
	// ENTRANCE ANALYTICS
	// ===========================================
	if (data.entrances && data.entrances.length > 0) {
		addSectionHeader("ניתוח כניסות");

		addField("סה״כ כניסות", data.entrances.length.toString(), colors.primary);

		const uniqueSessions = new Set(data.entrances.map((e) => e.sessionToken).filter(Boolean));
		addField("מפגשים ייחודיים", uniqueSessions.size.toString());

		const newSessions = data.entrances.filter((e) => e.isNewSession).length;
		addField("מפגשים חדשים", newSessions.toString());

		const lockedViews = data.entrances.filter((e) => e.isFormLocked).length;
		if (lockedViews > 0) {
			addField("צפיות בטופס נעול", lockedViews.toString(), colors.warning);
		}

		// Device breakdown
		const deviceCounts: Record<string, number> = {};
		data.entrances.forEach((e) => {
			const device = e.deviceType || "unknown";
			deviceCounts[device] = (deviceCounts[device] || 0) + 1;
		});

		const deviceLabelsHebrew: Record<string, string> = {
			mobile: "נייד",
			tablet: "טאבלט",
			desktop: "מחשב",
			unknown: "לא ידוע",
		};

		if (Object.keys(deviceCounts).length > 0) {
			checkNewPage(30);
			yPosition += 5;
			doc.setFontSize(10);
			doc.setFont("NotoSansHebrew", "bold");
			doc.setTextColor(...colors.secondary);
			doc.text(reverseText("פירוט לפי מכשיר:"), pageWidth - margin, yPosition, {
				align: "right",
			});
			yPosition += 7;

			doc.setFont("NotoSansHebrew", "normal");
			doc.setTextColor(...colors.text);
			Object.entries(deviceCounts).forEach(([device, count]) => {
				const hebrewDevice = deviceLabelsHebrew[device] || device;
				doc.text(
					reverseText(`• ${hebrewDevice}: ${count}`),
					pageWidth - margin - 5,
					yPosition,
					{
						align: "right",
					}
				);
				yPosition += 6;
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
			checkNewPage(30);
			yPosition += 5;
			doc.setFont("NotoSansHebrew", "bold");
			doc.setTextColor(...colors.secondary);
			doc.text(reverseText("פירוט לפי מדינה:"), pageWidth - margin, yPosition, {
				align: "right",
			});
			yPosition += 7;

			doc.setFont("NotoSansHebrew", "normal");
			doc.setTextColor(...colors.text);
			Object.entries(countryCounts).forEach(([country, count]) => {
				doc.text(reverseText(`• ${country}: ${count}`), pageWidth - margin - 5, yPosition, {
					align: "right",
				});
				yPosition += 6;
			});
		}

		// ===========================================
		// DETAILED ENTRANCE LOG
		// ===========================================
		addSectionHeader("לוג כניסות מפורט");

		data.entrances.forEach((entrance, index) => {
			checkNewPage(50);

			doc.setFontSize(11);
			doc.setFont("NotoSansHebrew", "bold");
			doc.setTextColor(...colors.primary);
			doc.text(reverseText(`כניסה #${index + 1}`), pageWidth - margin, yPosition, {
				align: "right",
			});
			yPosition += 7;

			addField("זמן", formatDate(entrance.timestamp));

			if (entrance.ipAddress) {
				addField("כתובת IP", entrance.ipAddress);
			}

			if (entrance.deviceType) {
				const hebrewDeviceType =
					deviceLabelsHebrew[entrance.deviceType] || entrance.deviceType;
				addField("סוג מכשיר", hebrewDeviceType);
			}

			if (entrance.browserName) {
				addField("דפדפן", entrance.browserName);
			}

			if (entrance.osName) {
				addField("מערכת הפעלה", entrance.osName);
			}

			if (entrance.country) {
				addField("מדינה", entrance.country);
			}

			if (entrance.referrer) {
				addField("מקור הפניה", entrance.referrer);
			}

			yPosition += 5;
			if (index < data.entrances.length - 1) {
				drawLine();
			}
		});
	}

	// ===========================================
	// FOOTER - Add page numbers
	// ===========================================
	const pageCount = doc.getNumberOfPages();
	for (let i = 1; i <= pageCount; i++) {
		doc.setPage(i);
		doc.setFontSize(8);
		doc.setFont("NotoSansHebrew", "normal");
		doc.setTextColor(...colors.muted);
		doc.text(reverseText(`עמוד ${i} מתוך ${pageCount}`), pageWidth / 2, pageHeight - 10, {
			align: "center",
		});
	}

	// Return PDF as buffer
	return Buffer.from(doc.output("arraybuffer"));
}
