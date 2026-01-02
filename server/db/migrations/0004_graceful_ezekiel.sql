ALTER TABLE `form_entrances_table` DROP FOREIGN KEY `form_entrances_table_session_id_form_sessions_table_id_fk`;
--> statement-breakpoint
ALTER TABLE `form_entrances_table` MODIFY COLUMN `session_id` varchar(64);