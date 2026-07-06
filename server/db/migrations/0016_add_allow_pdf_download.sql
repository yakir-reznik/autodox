ALTER TABLE `forms_table` ADD `allow_pdf_download` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions_table` ADD `allow_pdf_download` boolean;
