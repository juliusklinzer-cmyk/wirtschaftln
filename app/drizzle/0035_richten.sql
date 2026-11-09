-- Präsident richtet (WIR-009): wer über eine offene Strafe entschieden hat und wann.
-- Status erlassen/aufgehoben + gerichtet_von = erlassen, Status offen + gerichtet_von = bleibt.
ALTER TABLE `strafen` ADD `gerichtet_von` text;
--> statement-breakpoint
ALTER TABLE `strafen` ADD `gerichtet_am` text;
--> statement-breakpoint
ALTER TABLE `kasse` ADD `gerichtet_von` text;
--> statement-breakpoint
ALTER TABLE `kasse` ADD `gerichtet_am` text;
--> statement-breakpoint
-- Zahlungsaufforderung (WIR-011): wann der Kassenwart zuletzt ans Zahlen erinnert hat
ALTER TABLE `kasse` ADD `erinnert_am` text;
