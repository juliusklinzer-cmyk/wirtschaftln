-- Jahressieger (Jahresabschluss 2026): wer an Silvester ein Badge oder Amt hält, steht fürs Jahr fest drin
CREATE TABLE `jahressieger` (
	`id` text PRIMARY KEY NOT NULL,
	`jahr` integer NOT NULL,
	`key` text NOT NULL,
	`member_id` text NOT NULL REFERENCES `members`(`id`) ON DELETE CASCADE,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `jahressieger_jahr_key` ON `jahressieger` (`jahr`,`key`);
