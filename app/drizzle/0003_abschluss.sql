ALTER TABLE termine ADD COLUMN abgeschlossen_von TEXT REFERENCES members(id);
--> statement-breakpoint
ALTER TABLE termine ADD COLUMN abgeschlossen_am TEXT;
--> statement-breakpoint
ALTER TABLE wirtshaeuser ADD COLUMN weissbier TEXT;
