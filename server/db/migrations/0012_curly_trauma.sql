ALTER TABLE `submissions_table` ADD `is_archived` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions_table` ADD `archived_at` timestamp;