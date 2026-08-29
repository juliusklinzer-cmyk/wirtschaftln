CREATE TABLE IF NOT EXISTS `checkins` (
	`id` text PRIMARY KEY NOT NULL,
	`termin_id` text NOT NULL,
	`member_id` text NOT NULL,
	`platz` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`termin_id`) REFERENCES `termine`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `checkins_termin_member` ON `checkins` (`termin_id`,`member_id`);
