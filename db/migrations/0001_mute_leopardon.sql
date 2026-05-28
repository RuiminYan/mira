CREATE TABLE `chain_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ref_table` text NOT NULL,
	`ref_id` integer NOT NULL,
	`sha256` text NOT NULL,
	`mock_block_height` integer NOT NULL,
	`mock_tx_hash` text NOT NULL,
	`mock_chain` text DEFAULT 'mira-chain' NOT NULL,
	`payload` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer,
	`kind` text NOT NULL,
	`user_id` integer NOT NULL,
	`talent_id` integer,
	`party_a_name` text NOT NULL,
	`party_b_name` text NOT NULL,
	`scope` text NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`share` integer DEFAULT 0 NOT NULL,
	`pdf_url` text,
	`signed_at` integer NOT NULL,
	`sha256` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`talent_id`) REFERENCES `talents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`partner_id` integer NOT NULL,
	`talent_id` integer NOT NULL,
	`kind` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`decision_note` text,
	`refund_amount` integer,
	`arbitrator_id` integer,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`partner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`talent_id`) REFERENCES `talents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`arbitrator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`partner_id` integer NOT NULL,
	`company_name` text NOT NULL,
	`tax_number` text NOT NULL,
	`title_type` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`pdf_url` text,
	`sha256` text DEFAULT '' NOT NULL,
	`invoice_no` text,
	`created_at` integer NOT NULL,
	`issued_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`partner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`channel` text NOT NULL,
	`status` text DEFAULT 'created' NOT NULL,
	`mock_trade_no` text NOT NULL,
	`mock_buyer_no` text NOT NULL,
	`paid_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `takedowns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`talent_id` integer NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`chain_record_id` integer,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`talent_id`) REFERENCES `talents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`talent_id` integer,
	`kind` text NOT NULL,
	`url` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`mime_type` text NOT NULL,
	`sha256` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`talent_id`) REFERENCES `talents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`real_name` text NOT NULL,
	`id_card_hash_sha256` text NOT NULL,
	`id_card_last4` text NOT NULL,
	`phone` text NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`reviewed_by` integer,
	`reason` text,
	`created_at` integer NOT NULL,
	`reviewed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verifications_user_idx` ON `verifications` (`user_id`);--> statement-breakpoint
ALTER TABLE `orders` ADD `contract_id` integer;--> statement-breakpoint
ALTER TABLE `talents` ADD `avatar_url` text;--> statement-breakpoint
ALTER TABLE `talents` ADD `video_url` text;--> statement-breakpoint
ALTER TABLE `users` ADD `verified` integer DEFAULT 0 NOT NULL;