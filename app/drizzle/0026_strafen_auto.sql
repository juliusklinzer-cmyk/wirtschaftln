ALTER TABLE `strafen_regeln` ADD `ausloeser` text;
--> statement-breakpoint
ALTER TABLE `strafen_regeln` ADD `ausloeser_wert` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `strafen` ADD `auto` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `strafen_auto_eigene` ON `strafen` (`termin_id`, `regel_id`, `member_id`) WHERE `auto` = 1;
