CREATE TABLE IF NOT EXISTS `feedback` (
  `id` text PRIMARY KEY NOT NULL,
  `gruppe_id` text NOT NULL REFERENCES `gruppen`(`id`) ON DELETE cascade,
  `member_id` text NOT NULL,
  `name` text NOT NULL,
  `text` text NOT NULL,
  `erledigt_am` text,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `feedback_erledigt` ON `feedback` (`erledigt_am`, `created_at`);
