CREATE TABLE `submissions_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`form_id` int NOT NULL,
	`prefill_data` json,
	`additional_data` json,
	`created_by_user_id` int,
	`expires_at` timestamp NOT NULL,
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
ALTER TABLE `submissions_table` ADD CONSTRAINT `submissions_table_form_id_forms_table_id_fk` FOREIGN KEY (`form_id`) REFERENCES `forms_table`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions_table` ADD CONSTRAINT `submissions_table_created_by_user_id_users_table_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users_table`(`id`) ON DELETE no action ON UPDATE no action;