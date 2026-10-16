ALTER TABLE `termine` ADD `erfasst_von` text REFERENCES members(id);
--> statement-breakpoint
ALTER TABLE `termine` ADD `erfasst_am` text;
