CREATE TABLE `aemter` (
	`id` text PRIMARY KEY NOT NULL,
	`titel` text NOT NULL,
	`icon` text DEFAULT '🍺' NOT NULL,
	`member_id` text,
	`saison` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `besuche` (
	`id` text PRIMARY KEY NOT NULL,
	`termin_id` text NOT NULL,
	`member_id` text NOT NULL,
	`anwesend` integer DEFAULT true NOT NULL,
	`hoiben` integer DEFAULT 0 NOT NULL,
	`kaiserschmarrn` integer DEFAULT 0 NOT NULL,
	`sterne` integer,
	`kommentar` text,
	FOREIGN KEY (`termin_id`) REFERENCES `termine`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `besuche_termin_member` ON `besuche` (`termin_id`,`member_id`);--> statement-breakpoint
CREATE TABLE `kasse` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text,
	`termin_id` text,
	`grund` text NOT NULL,
	`betrag_cents` integer NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'offen' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`termin_id`) REFERENCES `termine`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`spitzname` text,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`photo_url` text,
	`role` text DEFAULT 'mitglied' NOT NULL,
	`status` text DEFAULT 'aktiv' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_email_unique` ON `members` (`email`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `termine` (
	`id` text PRIMARY KEY NOT NULL,
	`datum` text NOT NULL,
	`zeit` text DEFAULT '19:00' NOT NULL,
	`phase` text DEFAULT 'planung' NOT NULL,
	`planer_id` text,
	`wirtshaus_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`planer_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`wirtshaus_id`) REFERENCES `wirtshaeuser`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`termin_id` text NOT NULL,
	`member_id` text NOT NULL,
	`wert` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`termin_id`) REFERENCES `termine`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `votes_termin_member` ON `votes` (`termin_id`,`member_id`);--> statement-breakpoint
CREATE TABLE `wirtshaeuser` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`adresse` text,
	`bezirk` text,
	`lat` real,
	`lng` real,
	`photo_url` text,
	`created_at` text NOT NULL
);
