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

export const formsTable = mysqlTable("forms_table", {
	id: int().primaryKey().autoincrement(),

	// Form metadata
	title: varchar({ length: 255 }).notNull(),
	description: text(),

	// Status
	status: mysqlEnum("status", formStatusEnum).notNull().default("draft"),

	// Theme
	theme: mysqlEnum("theme", formThemeEnum).notNull().default("default"),

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

// Session status enum
export const sessionStatusEnum = [
	"started",
	"in_progress",
	"submitted",
	"abandoned",
] as const;
export type SessionStatus = (typeof sessionStatusEnum)[number];

// Device type enum for tracking
export const deviceTypeEnum = [
	"mobile",
	"tablet",
	"desktop",
	"unknown",
] as const;
export type DeviceType = (typeof deviceTypeEnum)[number];

// Form Sessions Table - Tracks unique form filling instances
export const formSessionsTable = mysqlTable("form_sessions_table", {
	id: int().primaryKey().autoincrement(),

	// Unique session token (passed via URL: ?session=xxx)
	sessionToken: varchar("session_token", { length: 64 })
		.notNull()
		.unique(),

	// Form relationship
	formId: int("form_id")
		.notNull()
		.references(() => formsTable.id, {
			onDelete: "cascade",
		}),

	// Session status
	status: mysqlEnum("status", sessionStatusEnum)
		.notNull()
		.default("started"),

	// Session metadata
	startedAt: timestamp("started_at").notNull().defaultNow(),
	lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
	submittedAt: timestamp("submitted_at"), // null until form is submitted

	// Initial entrance data (captured on first visit)
	initialIp: varchar("initial_ip", { length: 45 }), // IPv6 max length
	initialUserAgent: text("initial_user_agent"),
	initialReferrer: text("initial_referrer"),

	// Form submission data (JSON field for flexibility)
	submissionData: json("submission_data").$type<Record<string, any>>(),

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
	sessionId: varchar("session_id", { length: 64 }),

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
	isNewSession: boolean("is_new_session").notNull().default(false), // first visit of session?

	// Geographic/device data (optional, can be derived from IP/UA)
	country: varchar({ length: 2 }), // ISO country code
	deviceType: mysqlEnum("device_type", deviceTypeEnum),
	browserName: varchar("browser_name", { length: 100 }),
	osName: varchar("os_name", { length: 100 }),

	// Additional metadata (extensible JSON field)
	metadata: json().$type<{
		screenResolution?: string;
		language?: string;
		timezone?: string;
		[key: string]: any;
	}>(),

	// Timestamp (when entrance occurred)
	timestamp: timestamp().notNull().defaultNow(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

export const formsRelations = relations(formsTable, ({ one, many }) => ({
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
	sessions: many(formSessionsTable),
	entrances: many(formEntrancesTable),
}));

export const formElementsRelations = relations(
	formElementsTable,
	({ one, many }) => ({
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
	})
);

export const formSessionsRelations = relations(
	formSessionsTable,
	({ one, many }) => ({
		form: one(formsTable, {
			fields: [formSessionsTable.formId],
			references: [formsTable.id],
		}),
		entrances: many(formEntrancesTable),
	})
);

export const formEntrancesRelations = relations(
	formEntrancesTable,
	({ one }) => ({
		form: one(formsTable, {
			fields: [formEntrancesTable.formId],
			references: [formsTable.id],
		}),
	})
);
