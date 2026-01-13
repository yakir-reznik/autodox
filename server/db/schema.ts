import {
	int,
	mysqlTable,
	serial,
	varchar,
	text,
	json,
	timestamp,
	mysqlEnum,
	decimal,
	boolean,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";

// ============================================
// USERS TABLE
// ============================================

// User roles enum
export const userRoleEnum = ["admin", "viewer"] as const;
export type UserRole = (typeof userRoleEnum)[number];

export const usersTable = mysqlTable("users_table", {
	id: int().primaryKey().autoincrement(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull().unique(),
	password: varchar({ length: 255 }), // bcrypt hash
	apiKey: varchar("api_key", { length: 64 }).unique(),
	role: mysqlEnum("role", userRoleEnum).notNull().default("viewer"),
});

// ============================================
// FORM BUILDER - TYPES & ENUMS
// ============================================

// Form status enum
export const formStatusEnum = ["draft", "published", "archived"] as const;
export type FormStatus = (typeof formStatusEnum)[number];

// Form theme enum
export const formThemeEnum = ["default", "dark", "ocean", "forest", "unicorn"] as const;
export type FormTheme = (typeof formThemeEnum)[number];

// Element type enum - covers all field types and layout elements
export const elementTypeEnum = [
	// Input Fields
	"text",
	"email",
	"number",
	"textarea",
	"date",
	"time",
	"datetime",

	// Selection Fields
	"dropdown",
	"radio",
	"checkbox",
	"checkboxes", // multiple checkbox options

	// Special Fields
	"signature",

	// Layout Elements
	"heading_h1",
	"heading_h2",
	"heading_h3",
	"paragraph",
	"image",
	"video",
	"divider",
	"spacer",
	"section", // grouping container
] as const;
export type ElementType = (typeof elementTypeEnum)[number];

// ============================================
// TYPE DEFINITIONS FOR JSON CONFIGS
// ============================================

// Validation rules structure
export type ValidationRules = {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: number; // for number fields
	max?: number; // for number fields
	pattern?: string; // regex pattern
	customMessage?: string; // custom error message
	customRules?: Record<string, any>; // extensible for future custom validations
};

// Selection option structure (for dropdown, radio, checkboxes)
export type SelectionOption = {
	id: string; // unique identifier for the option
	label: string;
	value: string;
};

// Base config that all elements can have
type BaseElementConfig = {
	label?: string; // field label or element title
	placeholder?: string; // for input fields
	helpText?: string; // helper text below field
	defaultValue?: string | number | boolean;
};

// Field-specific configurations
type TextFieldConfig = BaseElementConfig & {
	validation?: ValidationRules;
};

type NumberFieldConfig = BaseElementConfig & {
	validation?: ValidationRules;
	step?: number; // increment step
};

type TextareaConfig = BaseElementConfig & {
	validation?: ValidationRules;
	rows?: number; // number of rows
};

type SelectionFieldConfig = BaseElementConfig & {
	validation?: ValidationRules;
	options: SelectionOption[]; // dropdown/radio/checkboxes options
	allowOther?: boolean; // allow "Other" option with text input
};

type SignatureFieldConfig = BaseElementConfig & {
	validation?: ValidationRules;
	maxWidth?: number;
	maxHeight?: number;
};

type HeadingConfig = {
	text: string;
	align?: "left" | "center" | "right";
};

type ParagraphConfig = {
	text: string;
	align?: "left" | "center" | "right";
};

type MediaConfig = {
	url: string;
	alt?: string; // for images
	caption?: string;
	width?: number;
	height?: number;
};

type DividerConfig = {
	style?: "solid" | "dashed" | "dotted";
	color?: string;
};

type SpacerConfig = {
	height: number; // in pixels
};

type SectionConfig = {
	title?: string;
	description?: string;
	collapsible?: boolean;
	defaultCollapsed?: boolean;
	bordered?: boolean;
	backgroundColor?: string;
};

// Union type for all possible configs
export type ElementConfig =
	| TextFieldConfig
	| NumberFieldConfig
	| TextareaConfig
	| SelectionFieldConfig
	| SignatureFieldConfig
	| HeadingConfig
	| ParagraphConfig
	| MediaConfig
	| DividerConfig
	| SpacerConfig
	| SectionConfig;

// ============================================
// FORM BUILDER TABLES
// ============================================

// Folders Table - For organizing forms
export const foldersTable = mysqlTable("folders_table", {
	id: int().primaryKey().autoincrement(),

	// Folder metadata
	name: varchar({ length: 255 }).notNull(),

	// Authorship
	createdBy: int("created_by")
		.notNull()
		.references(() => usersTable.id),

	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => sql`now()`),
});

export const formsTable = mysqlTable("forms_table", {
	id: int().primaryKey().autoincrement(),

	// Form metadata
	title: varchar({ length: 255 }).notNull(),
	description: text(),

	// Folder relationship (nullable - forms can be unfiled)
	folderId: int("folder_id").references(() => foldersTable.id, {
		onDelete: "cascade", // delete forms when folder is deleted
	}),

	// Status
	status: mysqlEnum("status", formStatusEnum).notNull().default("draft"),

	// Theme
	theme: mysqlEnum("theme", formThemeEnum).notNull().default("default"),

	// Webhook configuration
	webhookUrl: varchar("webhook_url", { length: 2048 }),

	// Authorship
	createdBy: int("created_by")
		.notNull()
		.references(() => usersTable.id),
	updatedBy: int("updated_by").references(() => usersTable.id),

	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => sql`now()`),
});

export const formElementsTable = mysqlTable("form_elements_table", {
	id: int().primaryKey().autoincrement(),

	// Form relationship
	formId: int("form_id")
		.notNull()
		.references(() => formsTable.id, {
			onDelete: "cascade", // delete elements when form is deleted
		}),

	// Element type
	type: mysqlEnum("type", elementTypeEnum).notNull(),

	// Positioning and hierarchy
	position: decimal({ precision: 10, scale: 5 }).notNull(), // e.g., 10.00000, 20.00000
	parentId: int("parent_id").references((): any => formElementsTable.id, {
		onDelete: "cascade", // delete children when parent is deleted
	}), // null for top-level elements, set for nested elements within sections

	// Element name/identifier (useful for field elements)
	name: varchar({ length: 255 }), // e.g., "email_address", "first_name"

	// Configuration (stores all element-specific settings)
	config: json().$type<ElementConfig>().notNull(),

	// Whether element is required (duplicate from config.validation.required for easy querying)
	isRequired: boolean("is_required").notNull().default(false),

	// Soft delete support (optional, for future)
	isDeleted: boolean("is_deleted").notNull().default(false),

	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => sql`now()`),
});

// ============================================
// FORM TRACKING - SESSION & ANALYTICS
// ============================================

// Submission status enum
export const submissionStatusEnum = ["pending", "in_progress", "submitted", "locked"] as const;
export type SubmissionStatus = (typeof submissionStatusEnum)[number];

// Device type enum for tracking
export const deviceTypeEnum = ["mobile", "tablet", "desktop", "unknown"] as const;
export type DeviceType = (typeof deviceTypeEnum)[number];

// Submissions Table - Tracks submission links from creation to completion
export const submissionsTable = mysqlTable("submissions_table", {
	id: int().primaryKey().autoincrement(),

	// Unique submission token (passed via URL: ?token=xxx)
	token: varchar("token", { length: 64 }).notNull().unique(),

	// Form relationship
	formId: int("form_id")
		.notNull()
		.references(() => formsTable.id, { onDelete: "cascade" }),

	// Link creation data
	prefillData: json("prefill_data").$type<Record<string, unknown>>(),
	additionalData: json("additional_data").$type<Record<string, unknown>>(),
	createdByUserId: int("created_by_user_id").references(() => usersTable.id),
	expiresAt: timestamp("expires_at").notNull(),

	// Webhook configuration (submission-level overrides form-level)
	webhookUrl: varchar("webhook_url", { length: 2048 }),

	// Lifecycle tracking
	status: mysqlEnum("status", submissionStatusEnum).notNull().default("pending"),

	// Submission data (filled when user submits)
	submissionData: json("submission_data").$type<Record<string, unknown>>(),

	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	startedAt: timestamp("started_at"),
	submittedAt: timestamp("submitted_at"),
	lockedAt: timestamp("locked_at"),
});

// Webhook Deliveries Table - Tracks webhook delivery attempts with audit trail
export const webhookDeliveriesTable = mysqlTable("webhook_deliveries_table", {
	id: int().primaryKey().autoincrement(),

	// Submission relationship
	submissionId: int("submission_id")
		.notNull()
		.references(() => submissionsTable.id, { onDelete: "cascade" }),

	// Webhook details
	webhookUrl: varchar("webhook_url", { length: 2048 }).notNull(),
	status: mysqlEnum("status", ["pending", "success", "failed", "retry"] as const)
		.notNull()
		.default("pending"),
	httpStatusCode: int("http_status_code"),

	// Request and response data
	requestPayload: json("request_payload").$type<Record<string, unknown>>(),
	requestHeaders: json("request_headers").$type<Record<string, string>>(),
	responseBody: text("response_body"),
	responseHeaders: json("response_headers").$type<Record<string, string>>(),
	errorMessage: varchar("error_message", { length: 1000 }),

	// Retry tracking
	retryCount: int("retry_count").notNull().default(0),
	nextRetryAt: timestamp("next_retry_at"),
	deliveredAt: timestamp("delivered_at"),

	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => sql`now()`),
});

// Form Entrances/Visits Table - Tracks each page view/entrance
export const formEntrancesTable = mysqlTable("form_entrances_table", {
	id: int().primaryKey().autoincrement(),

	// Session identifier (string token, nullable to support pre-session tracking)
	sessionToken: varchar("session_token", { length: 64 }),

	// Direct form reference (denormalized for easier querying)
	formId: int("form_id")
		.notNull()
		.references(() => formsTable.id, {
			onDelete: "cascade",
		}),

	// Request metadata
	ipAddress: varchar("ip_address", { length: 45 }), // IPv6 support
	userAgent: text("user_agent"),
	referrer: text(), // where they came from

	// Context flags
	isFormLocked: boolean("is_form_locked").notNull().default(false), // was session already submitted?

	// Timestamp (when entrance occurred)
	timestamp: timestamp().notNull().defaultNow(),
});

// ============================================
// UPLOADS TABLE
// ============================================

export const uploadsTable = mysqlTable("uploads_table", {
	id: int().primaryKey().autoincrement(),

	// File information
	filename: varchar({ length: 255 }).notNull().unique(), // Stored filename (unique, hashed)
	originalFilename: varchar("original_filename", { length: 255 }).notNull(), // User's original filename
	mimeType: varchar("mime_type", { length: 100 }).notNull(), // e.g., "image/jpeg"
	fileSize: int("file_size").notNull(), // Size in bytes

	// Path information
	storagePath: varchar("storage_path", { length: 500 }).notNull(), // Relative path: "uploads/2026/01/abc123.jpg"
	publicUrl: varchar("public_url", { length: 500 }).notNull(), // Public URL: "/uploads/2026/01/abc123.jpg"

	// Metadata
	uploadedBy: int("uploaded_by").references(() => usersTable.id), // Nullable for now (auth later)

	// Timestamps
	uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

export const foldersRelations = relations(foldersTable, ({ one, many }) => ({
	creator: one(usersTable, {
		fields: [foldersTable.createdBy],
		references: [usersTable.id],
		relationName: "folder_creator",
	}),
	forms: many(formsTable),
}));

export const formsRelations = relations(formsTable, ({ one, many }) => ({
	folder: one(foldersTable, {
		fields: [formsTable.folderId],
		references: [foldersTable.id],
	}),
	creator: one(usersTable, {
		fields: [formsTable.createdBy],
		references: [usersTable.id],
		relationName: "form_creator",
	}),
	updater: one(usersTable, {
		fields: [formsTable.updatedBy],
		references: [usersTable.id],
		relationName: "form_updater",
	}),
	elements: many(formElementsTable),
	submissions: many(submissionsTable),
	entrances: many(formEntrancesTable),
}));

export const formElementsRelations = relations(formElementsTable, ({ one, many }) => ({
	form: one(formsTable, {
		fields: [formElementsTable.formId],
		references: [formsTable.id],
	}),
	parent: one(formElementsTable, {
		fields: [formElementsTable.parentId],
		references: [formElementsTable.id],
		relationName: "element_hierarchy",
	}),
	children: many(formElementsTable, {
		relationName: "element_hierarchy",
	}),
}));

export const submissionsRelations = relations(submissionsTable, ({ one, many }) => ({
	form: one(formsTable, {
		fields: [submissionsTable.formId],
		references: [formsTable.id],
	}),
	creator: one(usersTable, {
		fields: [submissionsTable.createdByUserId],
		references: [usersTable.id],
		relationName: "submission_creator",
	}),
	webhookDeliveries: many(webhookDeliveriesTable),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveriesTable, ({ one }) => ({
	submission: one(submissionsTable, {
		fields: [webhookDeliveriesTable.submissionId],
		references: [submissionsTable.id],
	}),
}));

export const formEntrancesRelations = relations(formEntrancesTable, ({ one }) => ({
	form: one(formsTable, {
		fields: [formEntrancesTable.formId],
		references: [formsTable.id],
	}),
}));

export const uploadsRelations = relations(uploadsTable, ({ one }) => ({
	uploader: one(usersTable, {
		fields: [uploadsTable.uploadedBy],
		references: [usersTable.id],
		relationName: "upload_creator",
	}),
}));
