ALTER TABLE `gruendungs_tokens` ADD COLUMN `gruppe_id` text REFERENCES `gruppen`(`id`);
--> statement-breakpoint
ALTER TABLE `gruendungs_tokens` ADD COLUMN `quelle` text DEFAULT 'mitglied' NOT NULL;
--> statement-breakpoint
ALTER TABLE `gruendungs_tokens` ADD COLUMN `widmung` text;
--> statement-breakpoint
ALTER TABLE `gruendungs_tokens` ADD COLUMN `gewidmet_am` text;
--> statement-breakpoint
UPDATE `gruendungs_tokens` SET `gruppe_id` = (SELECT `id` FROM `gruppen` WHERE `ist_gruender` = 1) WHERE `gruppe_id` IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `gruendungs_tokens_gruppe_id` ON `gruendungs_tokens` (`gruppe_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `gruendungs_tokens_eingeloest_von` ON `gruendungs_tokens` (`eingeloest_von_gruppe_id`);
--> statement-breakpoint
ALTER TABLE `gruppen` ADD COLUMN `gesperrt_am` text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `token_anfragen` (
  `id` text PRIMARY KEY NOT NULL,
  `gruppe_id` text NOT NULL REFERENCES `gruppen`(`id`) ON DELETE cascade,
  `member_id` text NOT NULL,
  `grund` text NOT NULL,
  `status` text DEFAULT 'offen' NOT NULL,
  `entschieden_von_member_id` text,
  `entschieden_am` text,
  `token` text REFERENCES `gruendungs_tokens`(`token`),
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `token_anfragen_gruppe_status` ON `token_anfragen` (`gruppe_id`, `status`);
