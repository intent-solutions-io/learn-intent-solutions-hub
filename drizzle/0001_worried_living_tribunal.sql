CREATE TABLE `practice_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`score` integer NOT NULL,
	`correct` integer NOT NULL,
	`total` integer NOT NULL,
	`domain_breakdown` text,
	`name` text,
	`anonymous` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
