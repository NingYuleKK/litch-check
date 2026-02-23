CREATE TABLE `checkins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dateStr` varchar(10) NOT NULL,
	`taskId` int NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checkins_id` PRIMARY KEY(`id`)
);
