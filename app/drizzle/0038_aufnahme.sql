-- Aufnahme mit Bürge und Kodex (WIR-013, 09.11.2026): wer neu kommt, nennt einen Bürgen
-- und bestätigt den Kodex; bis der Bürge (oder Präsident/Admin) freigibt, steht er auf 'antrag'
ALTER TABLE `members` ADD `buerge_id` text;
--> statement-breakpoint
ALTER TABLE `members` ADD `kodex_am` text;
