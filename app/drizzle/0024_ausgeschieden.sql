ALTER TABLE `members` ADD `ausgeschieden_am` text;
--> statement-breakpoint
ALTER TABLE `members` ADD `abschied` text;
--> statement-breakpoint
UPDATE `members` SET `ausgeschieden_am` = (SELECT `beantwortet_am` FROM `wackel_anfragen` w WHERE w.`member_id` = `members`.`id` AND w.`antwort` = 'abschied' ORDER BY `beantwortet_am` DESC LIMIT 1), `abschied` = 'selbst' WHERE `status` = 'inaktiv' AND EXISTS (SELECT 1 FROM `wackel_anfragen` w WHERE w.`member_id` = `members`.`id` AND w.`antwort` = 'abschied');
