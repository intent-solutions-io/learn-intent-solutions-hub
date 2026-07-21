CREATE TABLE `questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lane` text NOT NULL,
	`question` text NOT NULL,
	`context` text,
	`urgency` text,
	`name` text,
	`anonymous` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text NOT NULL
);
