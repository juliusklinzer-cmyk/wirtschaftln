ALTER TABLE besuche ADD COLUMN schweinsbraten INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE besuche ADD COLUMN kaiser_sterne INTEGER;
--> statement-breakpoint
ALTER TABLE besuche ADD COLUMN brodn_sterne INTEGER;
--> statement-breakpoint
ALTER TABLE besuche ADD COLUMN kaiser_notiz TEXT;
--> statement-breakpoint
ALTER TABLE besuche ADD COLUMN brodn_notiz TEXT;
--> statement-breakpoint
ALTER TABLE wirtshaeuser ADD COLUMN biersorte TEXT NOT NULL DEFAULT 'Augustiner';
