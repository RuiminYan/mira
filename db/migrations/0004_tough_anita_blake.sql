CREATE TABLE `nft_transfers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nft_id` integer NOT NULL,
	`from_user_id` integer,
	`to_user_id` integer NOT NULL,
	`tx_hash` text NOT NULL,
	`block_height` integer NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`nft_id`) REFERENCES `nfts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `nfts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`talent_id` integer NOT NULL,
	`owner_id` integer NOT NULL,
	`token_id` integer NOT NULL,
	`contract_address` text DEFAULT '0xMIRACHAIN0001' NOT NULL,
	`chain_record_id` integer,
	`metadata_uri` text NOT NULL,
	`status` text DEFAULT 'minted' NOT NULL,
	`minted_at` integer NOT NULL,
	`last_transfer_at` integer,
	FOREIGN KEY (`talent_id`) REFERENCES `talents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nfts_token_id_unique` ON `nfts` (`token_id`);--> statement-breakpoint
CREATE TABLE `studio_credits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`lifetime_recharged` integer DEFAULT 0 NOT NULL,
	`lifetime_used` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `studio_credits_user_id_unique` ON `studio_credits` (`user_id`);--> statement-breakpoint
CREATE TABLE `studio_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`talent_id` integer NOT NULL,
	`kind` text NOT NULL,
	`prompt` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`output_url` text,
	`cost_credits` integer NOT NULL,
	`duration_ms` integer DEFAULT 0 NOT NULL,
	`chain_record_id` integer,
	`created_at` integer NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`talent_id`) REFERENCES `talents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `studio_recharges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`rmb` integer NOT NULL,
	`credits` integer NOT NULL,
	`chain_record_id` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
