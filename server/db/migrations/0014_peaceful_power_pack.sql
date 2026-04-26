CREATE TABLE `form_shares_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`form_id` int NOT NULL,
	`grantee_user_id` int NOT NULL,
	`granted_by` int NOT NULL,
	`can_view_submissions` boolean NOT NULL DEFAULT false,
	`can_create_submissions` boolean NOT NULL DEFAULT false,
	`can_manage_submissions` boolean NOT NULL DEFAULT false,
	`can_edit_form` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `form_shares_table_id` PRIMARY KEY(`id`),
	CONSTRAINT `form_shares_form_grantee_unique` UNIQUE(`form_id`,`grantee_user_id`)
);
--> statement-breakpoint
ALTER TABLE `users_table` MODIFY COLUMN `role` enum('admin','user','viewer') NOT NULL DEFAULT 'viewer';--> statement-breakpoint
ALTER TABLE `form_shares_table` ADD CONSTRAINT `form_shares_table_form_id_forms_table_id_fk` FOREIGN KEY (`form_id`) REFERENCES `forms_table`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `form_shares_table` ADD CONSTRAINT `form_shares_table_grantee_user_id_users_table_id_fk` FOREIGN KEY (`grantee_user_id`) REFERENCES `users_table`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `form_shares_table` ADD CONSTRAINT `form_shares_table_granted_by_users_table_id_fk` FOREIGN KEY (`granted_by`) REFERENCES `users_table`(`id`) ON DELETE no action ON UPDATE no action;