ALTER TABLE `forms_table` ADD `webhook_include_pdf` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions_table` ADD `webhook_include_pdf` boolean;