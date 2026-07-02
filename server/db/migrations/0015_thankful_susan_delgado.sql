CREATE TABLE `app_settings_table` (
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`updated_by` int,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `app_settings_table_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
ALTER TABLE `app_settings_table` ADD CONSTRAINT `app_settings_table_updated_by_users_table_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users_table`(`id`) ON DELETE no action ON UPDATE no action;