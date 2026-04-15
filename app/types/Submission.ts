export interface Submission {
	id: number;
	name: string | null;
	token: string;
	formId: number;
	prefillData: Record<string, unknown> | null;
	additionalData: Record<string, unknown> | null;
	externalId: string | null;
	createdByUserId: number | null;
	expiresAt: string;
	status: "pending" | "in_progress" | "submitted" | "locked";
	submissionData: Record<string, unknown> | null;
	createdAt: string;
	startedAt: string | null;
	submittedAt: string | null;
	lockedAt: string | null;
	isPublic: boolean;
}

export type FormEntrance = {
	id: number;
	sessionToken: string | null;
	formId: number;
	ipAddress: string | null;
	userAgent: string | null;
	referrer: string | null;
	isFormLocked: boolean;
	isNewSession: boolean;
	country: string | null;
	deviceType: FormEntranceDeviceType;
	browserName: string | null;
	osName: string | null;
	metadata: Record<string, unknown>;
	timestamp: string;
	createdAt: string;
};

export type FormEntranceDeviceType = "mobile" | "tablet" | "desktop" | "unknown";

export const statusColors: Record<string, string> = {
	pending: "bg-gray-100 text-gray-800",
	in_progress: "bg-blue-100 text-blue-800",
	submitted: "bg-green-100 text-green-800",
	locked: "bg-red-100 text-red-800",
};

export const statusLabels: Record<string, string> = {
	pending: "Pending",
	in_progress: "In Progress",
	submitted: "Submitted",
	locked: "Locked",
};
