SET @add_grantee_email_sql = (
	SELECT IF(
		COUNT(*) = 0,
		'ALTER TABLE `form_shares_table` ADD `grantee_email` varchar(255)',
		'SELECT 1'
	)
	FROM information_schema.columns
	WHERE table_schema = DATABASE()
		AND table_name = 'form_shares_table'
		AND column_name = 'grantee_email'
);--> statement-breakpoint
PREPARE add_grantee_email_stmt FROM @add_grantee_email_sql;--> statement-breakpoint
EXECUTE add_grantee_email_stmt;--> statement-breakpoint
DEALLOCATE PREPARE add_grantee_email_stmt;--> statement-breakpoint
UPDATE `form_shares_table` AS `shares`
INNER JOIN `users_table` AS `users`
	ON `shares`.`grantee_user_id` = `users`.`id`
SET `shares`.`grantee_email` = LOWER(`users`.`email`)
WHERE `shares`.`grantee_email` IS NULL
	OR `shares`.`grantee_email` = '';--> statement-breakpoint
ALTER TABLE `form_shares_table` MODIFY COLUMN `grantee_email` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `form_shares_table` MODIFY COLUMN `grantee_user_id` int;--> statement-breakpoint
SET @create_grantee_email_index_sql = (
	SELECT IF(
		COUNT(*) = 0,
		'CREATE UNIQUE INDEX `form_shares_form_grantee_email_unique` ON `form_shares_table` (`form_id`, `grantee_email`)',
		'SELECT 1'
	)
	FROM information_schema.statistics
	WHERE table_schema = DATABASE()
		AND table_name = 'form_shares_table'
		AND index_name = 'form_shares_form_grantee_email_unique'
);--> statement-breakpoint
PREPARE create_grantee_email_index_stmt FROM @create_grantee_email_index_sql;--> statement-breakpoint
EXECUTE create_grantee_email_index_stmt;--> statement-breakpoint
DEALLOCATE PREPARE create_grantee_email_index_stmt;--> statement-breakpoint
SET @drop_grantee_user_index_sql = (
	SELECT IF(
		COUNT(*) > 0,
		'DROP INDEX `form_shares_form_grantee_unique` ON `form_shares_table`',
		'SELECT 1'
	)
	FROM information_schema.statistics
	WHERE table_schema = DATABASE()
		AND table_name = 'form_shares_table'
		AND index_name = 'form_shares_form_grantee_unique'
);--> statement-breakpoint
PREPARE drop_grantee_user_index_stmt FROM @drop_grantee_user_index_sql;--> statement-breakpoint
EXECUTE drop_grantee_user_index_stmt;--> statement-breakpoint
DEALLOCATE PREPARE drop_grantee_user_index_stmt;
