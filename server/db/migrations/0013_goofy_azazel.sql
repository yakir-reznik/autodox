CREATE TABLE `webhook_deliveries_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submission_id` int NOT NULL,
	`webhook_url` varchar(2048) NOT NULL,
	`status` enum('pending','success','failed','retry') NOT NULL DEFAULT 'pending',
	`http_status_code` int,
	`request_payload` json,
	`response_body` text,
	`error_message` varchar(1000),
	`retry_count` int NOT NULL DEFAULT 0,
	`next_retry_at` timestamp,
	`delivered_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_deliveries_table_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `forms_table` ADD `webhook_url` varchar(2048);--> statement-breakpoint
ALTER TABLE `submissions_table` ADD `webhook_url` varchar(2048);--> statement-breakpoint
ALTER TABLE `webhook_deliveries_table` ADD CONSTRAINT `webhook_deliveries_table_submission_id_submissions_table_id_fk` FOREIGN KEY (`submission_id`) REFERENCES `submissions_table`(`id`) ON DELETE cascade ON UPDATE no action;