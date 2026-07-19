CREATE TABLE umfragen (
	id TEXT PRIMARY KEY,
	frage TEXT NOT NULL,
	antworten TEXT NOT NULL,
	erstellt_von TEXT REFERENCES members(id),
	created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE umfrage_stimmen (
	id TEXT PRIMARY KEY,
	umfrage_id TEXT NOT NULL REFERENCES umfragen(id) ON DELETE CASCADE,
	member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
	antwort_index INTEGER NOT NULL,
	updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX umfrage_stimmen_umfrage_member ON umfrage_stimmen(umfrage_id, member_id);
