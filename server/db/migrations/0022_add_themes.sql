CREATE TABLE `themes_table` (
	`id` varchar(50) NOT NULL PRIMARY KEY,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`colors` json NOT NULL,
	`base_css` varchar(255) NOT NULL
);
