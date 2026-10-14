CREATE TABLE IF NOT EXISTS `passwort_tokens` (
  `token` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `gruppe_id` text NOT NULL,
  `member_id` text NOT NULL,
  `bis` text NOT NULL,
  `created_at` text NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `passwort_tokens_email` ON `passwort_tokens` (`email`);
