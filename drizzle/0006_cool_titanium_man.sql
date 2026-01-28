ALTER TABLE "ideas" ADD COLUMN "submitted_by_first_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "ideas" ADD COLUMN "submitted_by_surname" text NOT NULL;--> statement-breakpoint
ALTER TABLE "ideas" DROP COLUMN "submitted_by_name";