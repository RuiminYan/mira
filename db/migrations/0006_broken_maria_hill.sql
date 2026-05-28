CREATE TABLE `achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`code` text NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`prefix` text NOT NULL,
	`hash` text NOT NULL,
	`scope` text DEFAULT '[]' NOT NULL,
	`last_used_at` integer,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `badges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`icon` text DEFAULT 'Award' NOT NULL,
	`rarity` text DEFAULT 'common' NOT NULL,
	`tone` text DEFAULT 'brand' NOT NULL,
	`criteria` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `badges_code_unique` ON `badges` (`code`);--> statement-breakpoint
CREATE TABLE `csm_touches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`assignment_id` integer NOT NULL,
	`csm_id` integer NOT NULL,
	`kind` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`next_action` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `csm_assignments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`csm_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `enterprise_leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company` text NOT NULL,
	`contact_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`employees` text DEFAULT '' NOT NULL,
	`industry` text DEFAULT '' NOT NULL,
	`requirement` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'pricing_form' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `export_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`payload_key` text NOT NULL,
	`size` integer,
	`requested_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `leaderboards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`period` text NOT NULL,
	`kind` text NOT NULL,
	`user_id` integer,
	`talent_id` integer,
	`rank` integer NOT NULL,
	`value` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leaderboards_triple_idx` ON `leaderboards` (`period`,`kind`,`rank`);--> statement-breakpoint
CREATE TABLE `plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`price_month` integer DEFAULT 0 NOT NULL,
	`price_year` integer DEFAULT 0 NOT NULL,
	`quota_orders` integer DEFAULT 0 NOT NULL,
	`quota_api_calls` integer DEFAULT 0 NOT NULL,
	`quota_seats` integer DEFAULT 1 NOT NULL,
	`features` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'live' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plans_code_unique` ON `plans` (`code`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`plan_id` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`started_at` integer NOT NULL,
	`ends_at` integer,
	`auto_renew` integer DEFAULT true NOT NULL,
	`next_charge_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`badge_id` integer NOT NULL,
	`earned_at` integer NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_badges_pair_idx` ON `user_badges` (`user_id`,`badge_id`);--> statement-breakpoint
CREATE TABLE `webhook_deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`webhook_id` integer NOT NULL,
	`event` text NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`http_code` integer,
	`response_snippet` text,
	`attempt_count` integer DEFAULT 1 NOT NULL,
	`next_retry_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`webhook_id`) REFERENCES `webhooks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`url` text NOT NULL,
	`event` text DEFAULT '[]' NOT NULL,
	`secret` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`fail_count` integer DEFAULT 0 NOT NULL,
	`last_delivered_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `csm_assignments` ADD `tier` text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `csm_assignments` ADD `next_checkin_at` integer;--> statement-breakpoint
ALTER TABLE `csm_assignments` ADD `tags` text DEFAULT '[]' NOT NULL;