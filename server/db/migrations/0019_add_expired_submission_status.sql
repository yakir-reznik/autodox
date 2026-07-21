ALTER TABLE `submissions_table` MODIFY COLUMN `status` enum('pending','in_progress','submitted','locked','expired') NOT NULL DEFAULT 'pending';
