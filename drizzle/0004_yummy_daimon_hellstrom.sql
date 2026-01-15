ALTER TABLE "use_cases" ADD COLUMN "is_man_days_manual_override" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "use_cases" ADD COLUMN "progress_percent" double precision DEFAULT 0;--> statement-breakpoint
ALTER TABLE "use_cases" ADD COLUMN "progress_notes" text;--> statement-breakpoint
ALTER TABLE "use_cases" ADD COLUMN "last_progress_update" timestamp;