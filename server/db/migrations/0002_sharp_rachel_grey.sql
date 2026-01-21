ALTER TABLE `forms_table` ADD `password_hash` varchar(255);--> statement-breakpoint
ALTER TABLE `submissions_table` ADD `password_hash` varchar(255);--> statement-breakpoint
ALTER TABLE `submissions_table` ADD `password_verified` boolean DEFAULT false NOT NULL;