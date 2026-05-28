ALTER TABLE `tickets` ADD `verify_token` text;--> statement-breakpoint
ALTER TABLE `tickets` ADD `verified_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `public_slug` text;--> statement-breakpoint
ALTER TABLE `users` ADD `last_login_date` text;--> statement-breakpoint
ALTER TABLE `users` ADD `streak_days` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `users_public_slug_unique` ON `users` (`public_slug`);