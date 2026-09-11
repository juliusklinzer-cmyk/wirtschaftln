DROP INDEX IF EXISTS `gruendungs_tokens_member_id_unique`;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `gruendungs_tokens_member_id` ON `gruendungs_tokens` (`member_id`);
