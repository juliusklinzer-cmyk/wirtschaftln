ALTER TABLE members ADD COLUMN herkunft TEXT;
--> statement-breakpoint
ALTER TABLE members ADD COLUMN lieblingsbier TEXT;
--> statement-breakpoint
ALTER TABLE members ADD COLUMN lieblingsweissbier TEXT;
--> statement-breakpoint
ALTER TABLE members ADD COLUMN leibspeise TEXT;
--> statement-breakpoint
ALTER TABLE members ADD COLUMN lieblingsbiergarten TEXT;
--> statement-breakpoint
ALTER TABLE members ADD COLUMN lieblingswirtshaus TEXT;
--> statement-breakpoint
ALTER TABLE members ADD COLUMN verein TEXT;
--> statement-breakpoint
ALTER TABLE members ADD COLUMN schafkopfer INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE members ADD COLUMN beschreibung TEXT;
--> statement-breakpoint
ALTER TABLE members ADD COLUMN erstanmeldung INTEGER NOT NULL DEFAULT 0;
