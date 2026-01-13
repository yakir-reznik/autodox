CREATE TABLE `folders_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `folders_table_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `forms_table` ADD `folder_id` int;--> statement-breakpoint
ALTER TABLE `folders_table` ADD CONSTRAINT `folders_table_created_by_users_table_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users_table`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forms_table` ADD CONSTRAINT `forms_table_folder_id_folders_table_id_fk` FOREIGN KEY (`folder_id`) REFERENCES `folders_table`(`id`) ON DELETE cascade ON UPDATE no action;