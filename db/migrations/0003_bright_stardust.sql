CREATE TABLE `activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`actor_id` integer,
	`ref_table` text,
	`ref_id` integer,
	`display_text` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_id` integer,
	`actor_role` text DEFAULT '' NOT NULL,
	`action` text NOT NULL,
	`ref_table` text,
	`ref_id` integer,
	`before` text,
	`after` text,
	`note` text DEFAULT '' NOT NULL,
	`ip` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `distributions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`channel` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`external_ref_id` text,
	`play_url` text,
	`reject_reason` text,
	`payload` text,
	`created_at` integer NOT NULL,
	`pushed_at` integer,
	`published_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mcn_creators` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mcn_id` integer NOT NULL,
	`creator_id` integer NOT NULL,
	`commission_pct` integer DEFAULT 15 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`invite_token` text,
	`created_at` integer NOT NULL,
	`responded_at` integer,
	FOREIGN KEY (`mcn_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
