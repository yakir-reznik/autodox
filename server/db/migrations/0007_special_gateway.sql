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
ALTER TABLE `uploads_table` ADD CONSTRAINT `uploads_table_uploaded_by_users_table_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users_table`(`id`) ON DELETE no action ON UPDATE no action;