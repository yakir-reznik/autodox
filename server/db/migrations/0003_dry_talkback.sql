CREATE TABLE `form_entrances_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int,
	`form_id` int NOT NULL,
	`ip_address` varchar(45),
	`user_agent` text,
	`referrer` text,
	`is_form_locked` boolean NOT NULL DEFAULT false,
	`is_new_session` boolean NOT NULL DEFAULT false,
	`country` varchar(2),
	`device_type` enum('mobile','tablet','desktop','unknown'),
	`browser_name` varchar(100),
	`os_name` varchar(100),
	`metadata` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `form_entrances_table_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `form_sessions_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_token` varchar(64) NOT NULL,
	`form_id` int NOT NULL,
	`status` enum('started','in_progress','submitted','abandoned') NOT NULL DEFAULT 'started',
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`last_accessed_at` timestamp NOT NULL DEFAULT (now()),
	`submitted_at` timestamp,
	`initial_ip` varchar(45),
	`initial_user_agent` text,
	`initial_referrer` text,
	`submission_data` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `form_sessions_table_id` PRIMARY KEY(`id`),
	CONSTRAINT `form_sessions_table_session_token_unique` UNIQUE(`session_token`)
);
--> statement-breakpoint
ALTER TABLE `form_entrances_table` ADD CONSTRAINT `form_entrances_table_session_id_form_sessions_table_id_fk` FOREIGN KEY (`session_id`) REFERENCES `form_sessions_table`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `form_entrances_table` ADD CONSTRAINT `form_entrances_table_form_id_forms_table_id_fk` FOREIGN KEY (`form_id`) REFERENCES `forms_table`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `form_sessions_table` ADD CONSTRAINT `form_sessions_table_form_id_forms_table_id_fk` FOREIGN KEY (`form_id`) REFERENCES `forms_table`(`id`) ON DELETE cascade ON UPDATE no action;