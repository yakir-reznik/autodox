ALTER TABLE `form_entrances_table` RENAME COLUMN `session_id` TO `session_token`;--> statement-breakpoint
ALTER TABLE `form_entrances_table` DROP COLUMN `is_new_session`;--> statement-breakpoint
ALTER TABLE `form_entrances_table` DROP COLUMN `country`;--> statement-breakpoint
ALTER TABLE `form_entrances_table` DROP COLUMN `device_type`;--> statement-breakpoint
ALTER TABLE `form_entrances_table` DROP COLUMN `browser_name`;--> statement-breakpoint
ALTER TABLE `form_entrances_table` DROP COLUMN `os_name`;--> statement-breakpoint
ALTER TABLE `form_entrances_table` DROP COLUMN `metadata`;--> statement-breakpoint
ALTER TABLE `form_entrances_table` DROP COLUMN `created_at`;