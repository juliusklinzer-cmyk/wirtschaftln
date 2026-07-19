ALTER TABLE wirtshaeuser ADD COLUMN telefon TEXT;
--> statement-breakpoint
ALTER TABLE wirtshaeuser ADD COLUMN vorgeschlagen_von TEXT REFERENCES members(id);
--> statement-breakpoint
CREATE TABLE push_subscriptions (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL
);
