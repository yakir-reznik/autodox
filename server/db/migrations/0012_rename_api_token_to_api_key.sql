ALTER TABLE `users_table` RENAME COLUMN `api_token` TO `api_key`;--> statement-breakpoint
ALTER TABLE `users_table` RENAME INDEX `users_table_api_token_unique` TO `users_table_api_key_unique`;
