ALTER TABLE `forms_table` ADD `allow_public_submissions` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions_table` ADD `is_public` boolean DEFAULT false NOT NULL;