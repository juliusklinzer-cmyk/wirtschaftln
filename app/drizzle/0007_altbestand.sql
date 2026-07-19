ALTER TABLE wirtshaeuser ADD COLUMN altbestand INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE TABLE wirtshaus_bewertungen (
	id TEXT PRIMARY KEY,
	wirtshaus_id TEXT NOT NULL REFERENCES wirtshaeuser(id) ON DELETE CASCADE,
	member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
	sterne INTEGER NOT NULL,
	kommentar TEXT,
	updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX wirtshaus_bewertungen_wirtshaus_member ON wirtshaus_bewertungen(wirtshaus_id, member_id);
