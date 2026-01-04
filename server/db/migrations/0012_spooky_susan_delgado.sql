ALTER TABLE `users_table` RENAME COLUMN `api_token` TO `api_key`;--> statement-breakpoint
ALTER TABLE `users_table` DROP INDEX `users_table_api_token_unique`;--> statement-breakpoint
ALTER TABLE `users_table` ADD CONSTRAINT `users_table_api_key_unique` UNIQUE(`api_key`);