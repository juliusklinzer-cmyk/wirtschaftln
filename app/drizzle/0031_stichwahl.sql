-- Stichwahl bei Gleichstand (06.11.2026): nur die Gleichplatzierten stehen zur Wahl
ALTER TABLE `praesident_wahlen` ADD `stichwahl` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `praesident_wahlen` ADD `kandidaten` text;
