CREATE TABLE `strafen_regeln` (
	`id` text PRIMARY KEY NOT NULL,
	`art` text NOT NULL,
	`name` text NOT NULL,
	`detail` text,
	`wp_staffel` text DEFAULT '[]' NOT NULL,
	`betrag_cents` integer DEFAULT 0 NOT NULL,
	`frist_art` text DEFAULT 'beginn' NOT NULL,
	`frist_wert` integer DEFAULT 0 NOT NULL,
	`nicht_eingetragen_zusage` integer DEFAULT 1 NOT NULL,
	`erlassbar` integer DEFAULT 1 NOT NULL,
	`aktiv` integer DEFAULT 1 NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`config_uebernommen` integer DEFAULT 1 NOT NULL,
	`erstellt_am` text NOT NULL,
	`erstellt_von` text REFERENCES members(id) ON DELETE set null,
	`geaendert_am` text,
	`geaendert_von` text REFERENCES members(id) ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `strafen_regeln` (`id`, `art`, `name`, `detail`, `wp_staffel`, `betrag_cents`, `frist_art`, `frist_wert`, `nicht_eingetragen_zusage`, `erlassbar`, `sort`, `config_uebernommen`, `erstellt_am`) VALUES
	('sr_unentschuldigt', 'unentschuldigt', 'Unentschuldigt gefehlt', 'Zugesagt, nicht abgesagt oder zu spät abgesagt und nicht gekommen.', '[-5,-10,-15]', 0, 'beginn', 0, 1, 1, 1, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now')),
	('sr_entschuldigt', 'entschuldigt', 'Entschuldigt gefehlt (Serie)', 'Rechtzeitig abgesagt, aber mehrmals hintereinander.', '[0,-1,-5,-10]', 0, 'beginn', 0, 1, 1, 2, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now')),
	('sr_serie', 'serie', '3× unentschuldigt in Folge', 'Wer dreimal hintereinander unentschuldigt fehlt, wackelt und wird gefragt, ob er noch dabei ist.', '[0]', 0, 'beginn', 0, 1, 1, 3, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'));
--> statement-breakpoint
CREATE TABLE `strafen` (
	`id` text PRIMARY KEY NOT NULL,
	`regel_id` text REFERENCES strafen_regeln(id) ON DELETE set null,
	`art` text NOT NULL,
	`name` text NOT NULL,
	`member_id` text NOT NULL REFERENCES members(id) ON DELETE cascade,
	`termin_id` text REFERENCES termine(id) ON DELETE cascade,
	`wp` integer,
	`betrag_cents` integer DEFAULT 0 NOT NULL,
	`kasse_id` text REFERENCES kasse(id) ON DELETE set null,
	`status` text DEFAULT 'offen' NOT NULL,
	`gebucht_von` text REFERENCES members(id) ON DELETE set null,
	`benachrichtigt` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `strafen_auto` ON `strafen` (`termin_id`, `art`, `member_id`) WHERE `art` <> 'eigene';
--> statement-breakpoint
CREATE INDEX `strafen_member` ON `strafen` (`member_id`);
--> statement-breakpoint
ALTER TABLE `votes` ADD `abgesagt_am` text;
