CREATE TABLE `form_elements_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`form_id` int NOT NULL,
	`type` enum('text','email','number','textarea','date','time','datetime','dropdown','radio','checkbox','checkboxes','signature','heading_h1','heading_h2','heading_h3','paragraph','image','video','divider','spacer','section') NOT NULL,
	`position` decimal(10,5) NOT NULL,
	`parent_id` int,
	`name` varchar(255),
	`config` json NOT NULL,
	`is_required` boolean NOT NULL DEFAULT false,
	`is_deleted` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `form_elements_table_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `form_entrances_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_token` varchar(64),
	`form_id` int NOT NULL,
	`ip_address` varchar(45),
	`user_agent` text,
	`referrer` text,
	`is_form_locked` boolean NOT NULL DEFAULT false,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `form_entrances_table_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forms_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`theme` enum('default','dark','ocean','forest','unicorn') NOT NULL DEFAULT 'default',
	`webhook_url` varchar(2048),
	`created_by` int NOT NULL,
	`updated_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `forms_table_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissions_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`form_id` int NOT NULL,
	`prefill_data` json,
	`additional_data` json,
	`created_by_user_id` int,
	`expires_at` timestamp NOT NULL,
	`webhook_url` varchar(2048),
	`status` enum('pending','in_progress','submitted','locked') NOT NULL DEFAULT 'pending',
	`submission_data` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`started_at` timestamp,
	`submitted_at` timestamp,
	`locked_at` timestamp,
	CONSTRAINT `submissions_table_id` PRIMARY KEY(`id`),
	CONSTRAINT `submissions_table_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `uploads_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filename` varchar(255) NOT NULL,
	`original_filename` varchar(255) NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`file_size` int NOT NULL,
	`storage_path` varchar(500) NOT NULL,
	`public_url` varchar(500) NOT NULL,
	`uploaded_by` int,
	`uploaded_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `uploads_table_id` PRIMARY KEY(`id`),
	CONSTRAINT `uploads_table_filename_unique` UNIQUE(`filename`)
);
--> statement-breakpoint
CREATE TABLE `users_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255),
	`api_key` varchar(64),
	`role` enum('admin','viewer') NOT NULL DEFAULT 'viewer',
	CONSTRAINT `users_table_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_table_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_table_api_key_unique` UNIQUE(`api_key`)
);
--> statement-breakpoint
CREATE TABLE `webhook_deliveries_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submission_id` int NOT NULL,
	`webhook_url` varchar(2048) NOT NULL,
	`status` enum('pending','success','failed','retry') NOT NULL DEFAULT 'pending',
	`http_status_code` int,
	`request_payload` json,
	`request_headers` json,
	`response_body` text,
	`response_headers` json,
	`error_message` varchar(1000),
	`retry_count` int NOT NULL DEFAULT 0,
	`next_retry_at` timestamp,
	`delivered_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_deliveries_table_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `form_elements_table` ADD CONSTRAINT `form_elements_table_form_id_forms_table_id_fk` FOREIGN KEY (`form_id`) REFERENCES `forms_table`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `form_elements_table` ADD CONSTRAINT `form_elements_table_parent_id_form_elements_table_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `form_elements_table`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `form_entrances_table` ADD CONSTRAINT `form_entrances_table_form_id_forms_table_id_fk` FOREIGN KEY (`form_id`) REFERENCES `forms_table`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forms_table` ADD CONSTRAINT `forms_table_created_by_users_table_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users_table`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forms_table` ADD CONSTRAINT `forms_table_updated_by_users_table_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users_table`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions_table` ADD CONSTRAINT `submissions_table_form_id_forms_table_id_fk` FOREIGN KEY (`form_id`) REFERENCES `forms_table`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions_table` ADD CONSTRAINT `submissions_table_created_by_user_id_users_table_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users_table`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `uploads_table` ADD CONSTRAINT `uploads_table_uploaded_by_users_table_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users_table`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhook_deliveries_table` ADD CONSTRAINT `webhook_deliveries_table_submission_id_submissions_table_id_fk` FOREIGN KEY (`submission_id`) REFERENCES `submissions_table`(`id`) ON DELETE cascade ON UPDATE no action;