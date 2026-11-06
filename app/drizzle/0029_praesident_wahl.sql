-- Präsident gewählt statt nach WP (06.11.2026): Wahl beim Schließen des ersten Stammtischs im Jahr, eine Woche offen
CREATE TABLE `praesident_wahlen` (
	`id` text PRIMARY KEY NOT NULL,
	`jahr` integer NOT NULL,
	`ende` text NOT NULL,
	`termin_id` text REFERENCES `termine`(`id`) ON DELETE SET NULL,
	`gestartet_von` text REFERENCES `members`(`id`) ON DELETE SET NULL,
	`status` text DEFAULT 'offen' NOT NULL,
	`gewinner_id` text REFERENCES `members`(`id`) ON DELETE SET NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `praesident_stimmen` (
	`id` text PRIMARY KEY NOT NULL,
	`wahl_id` text NOT NULL REFERENCES `praesident_wahlen`(`id`) ON DELETE CASCADE,
	`member_id` text NOT NULL REFERENCES `members`(`id`) ON DELETE CASCADE,
	`kandidat_id` text NOT NULL REFERENCES `members`(`id`) ON DELETE CASCADE,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `praesident_stimmen_wahl_member` ON `praesident_stimmen` (`wahl_id`,`member_id`);
