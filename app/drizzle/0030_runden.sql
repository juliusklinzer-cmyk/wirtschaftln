-- Runden einzeln (06.11.2026): wer hat wem was ausgegeben, zurücknehmen darf nur der Spender
CREATE TABLE `runden` (
	`id` text PRIMARY KEY NOT NULL,
	`termin_id` text NOT NULL REFERENCES `termine`(`id`) ON DELETE CASCADE,
	`spender_id` text NOT NULL REFERENCES `members`(`id`) ON DELETE CASCADE,
	`art` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `runden_empfaenger` (
	`runde_id` text NOT NULL REFERENCES `runden`(`id`) ON DELETE CASCADE,
	`member_id` text NOT NULL REFERENCES `members`(`id`) ON DELETE CASCADE,
	PRIMARY KEY (`runde_id`, `member_id`)
);
