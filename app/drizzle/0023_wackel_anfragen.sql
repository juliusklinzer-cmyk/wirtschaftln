CREATE TABLE `wackel_anfragen` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL REFERENCES members(id) ON DELETE cascade,
	`token` text NOT NULL,
	`erstellt_am` text NOT NULL,
	`antwort` text,
	`beantwortet_am` text,
	`praesident_gemeldet_am` text,
	`erledigt` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wackel_anfragen_token` ON `wackel_anfragen` (`token`);
