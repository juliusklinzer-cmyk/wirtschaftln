ALTER TABLE `members` ADD `mail_termin` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `members` ADD `mail_erinnerung` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `members` ADD `mail_kasse` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
CREATE TABLE `erinnerungen` (
	`id` text PRIMARY KEY NOT NULL,
	`termin_id` text NOT NULL REFERENCES termine(id) ON DELETE cascade,
	`art` text NOT NULL,
	`member_id` text NOT NULL,
	`gesendet_am` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `erinnerungen_termin_art_member` ON `erinnerungen` (`termin_id`, `art`, `member_id`);
