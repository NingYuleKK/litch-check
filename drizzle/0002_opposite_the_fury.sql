CREATE TABLE `daily_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dateStr` varchar(10) NOT NULL,
	`content` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_logs_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_logs_dateStr_unique` UNIQUE(`dateStr`)
);
