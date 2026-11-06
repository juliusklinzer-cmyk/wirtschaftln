-- Bierdeckel (06.11.2026): wie viele Hoibe/Schnaps dir per Runde ausgegeben wurden (in hoiben/schnaps enthalten, golden am Deckel)
ALTER TABLE `besuche` ADD `hoiben_ausgegeben` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `besuche` ADD `schnaps_ausgegeben` integer DEFAULT 0 NOT NULL;
