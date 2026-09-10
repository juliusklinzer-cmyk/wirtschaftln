CREATE TABLE `gruendungs_tokens` (
	`token` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`status` text DEFAULT 'offen' NOT NULL,
	`eingeloest_von_gruppe_id` text,
	`eingeloest_am` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`eingeloest_von_gruppe_id`) REFERENCES `gruppen`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gruendungs_tokens_member_id_unique` ON `gruendungs_tokens` (`member_id`);--> statement-breakpoint
CREATE TABLE `gruppen` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`motto` text,
	`stadt` text,
	`gruendungsjahr` integer,
	`typ` text DEFAULT 'wandernd' NOT NULL,
	`gruendungscode` text,
	`ist_gruender` integer DEFAULT false NOT NULL,
	`config` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'aktiv' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gruppen_gruendungscode` ON `gruppen` (`gruendungscode`);--> statement-breakpoint
CREATE TABLE `konten` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`gruppe_id` text NOT NULL,
	`member_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`gruppe_id`) REFERENCES `gruppen`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `konten_email_gruppe` ON `konten` (`email`,`gruppe_id`);--> statement-breakpoint
CREATE INDEX `konten_email` ON `konten` (`email`);