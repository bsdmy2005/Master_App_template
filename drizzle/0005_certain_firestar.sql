CREATE TYPE "public"."idea_priority" AS ENUM('not-set', 'low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."idea_status" AS ENUM('submitted', 'under-review', 'needs-clarification', 'accepted', 'rejected', 'promoted-to-usecase');--> statement-breakpoint
CREATE TABLE "ideas" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text,
	"proposed_client_name" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"submitted_by_name" text NOT NULL,
	"submitted_by_email" text NOT NULL,
	"submitted_by_organization" text,
	"status" "idea_status" DEFAULT 'submitted' NOT NULL,
	"priority" "idea_priority" DEFAULT 'not-set' NOT NULL,
	"internal_notes" text,
	"promoted_to_use_case_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" text
);
--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;