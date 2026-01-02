CREATE TABLE `form_elements_table` (
	`id` serial AUTO_INCREMENT NOT NULL,
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
CREATE TABLE `forms_table` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`created_by` int NOT NULL,
	`updated_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `forms_table_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users_table` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`age` int NOT NULL,
	`email` varchar(255) NOT NULL,
	CONSTRAINT `users_table_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_table_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `form_elements_table` ADD CONSTRAINT `form_elements_table_form_id_forms_table_id_fk` FOREIGN KEY (`form_id`) REFERENCES `forms_table`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `form_elements_table` ADD CONSTRAINT `form_elements_table_parent_id_form_elements_table_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `form_elements_table`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forms_table` ADD CONSTRAINT `forms_table_created_by_users_table_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users_table`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forms_table` ADD CONSTRAINT `forms_table_updated_by_users_table_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users_table`(`id`) ON DELETE no action ON UPDATE no action;