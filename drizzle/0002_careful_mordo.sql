ALTER TABLE `users_table` ADD `role` enum('admin','viewer') DEFAULT 'viewer' NOT NULL;--> statement-breakpoint
ALTER TABLE `users_table` DROP COLUMN `age`;