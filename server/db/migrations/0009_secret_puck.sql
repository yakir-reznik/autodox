ALTER TABLE `users_table` ADD `api_token` varchar(64);--> statement-breakpoint
ALTER TABLE `users_table` ADD CONSTRAINT `users_table_api_token_unique` UNIQUE(`api_token`);