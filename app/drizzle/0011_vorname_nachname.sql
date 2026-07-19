ALTER TABLE members ADD COLUMN vorname TEXT;
--> statement-breakpoint
ALTER TABLE members ADD COLUMN nachname TEXT;
--> statement-breakpoint
UPDATE members SET
	vorname = CASE WHEN instr(name, ' ') > 0 THEN substr(name, 1, instr(name, ' ') - 1) ELSE name END,
	nachname = CASE WHEN instr(name, ' ') > 0 THEN substr(name, instr(name, ' ') + 1) ELSE NULL END;
