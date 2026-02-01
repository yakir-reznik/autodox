ALTER TABLE `users_table` ADD `google_id` varchar(255);--> statement-breakpoint
ALTER TABLE `users_table` ADD `created_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `users_table` ADD `last_login_at` timestamp;