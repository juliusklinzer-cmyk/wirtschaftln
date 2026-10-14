CREATE TABLE IF NOT EXISTS `fotos` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
INSERT OR REPLACE INTO `fotos` (`id`, `data`) SELECT `id`, `photo_url` FROM `members` WHERE `photo_url` LIKE 'data:%';
--> statement-breakpoint
INSERT OR REPLACE INTO `fotos` (`id`, `data`) SELECT `id`, `photo_url` FROM `wirtshaeuser` WHERE `photo_url` LIKE 'data:%';
--> statement-breakpoint
UPDATE `members` SET `photo_url` = '/foto/' || `id` || '-' || lower(hex(randomblob(5))) || '.jpg' WHERE `photo_url` LIKE 'data:%';
--> statement-breakpoint
UPDATE `wirtshaeuser` SET `photo_url` = '/foto/' || `id` || '-' || lower(hex(randomblob(5))) || '.jpg' WHERE `photo_url` LIKE 'data:%';
