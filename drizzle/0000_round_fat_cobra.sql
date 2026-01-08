CREATE TYPE "public"."complexity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."gap_level" AS ENUM('1', '2', '3', '4', '5');--> statement-breakpoint
CREATE TYPE "public"."use_case_status" AS ENUM('high-level definition', 'groomed', 'defined', 'in development', 'completed');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in-progress', 'done');--> statement-breakpoint
CREATE TYPE "public"."dependency_type" AS ENUM('blocks', 'covered-by', 'depends-on', 'related-to');--> statement-breakpoint
CREATE TABLE "developers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"capacity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"systems" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "use_cases" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"use_case_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"complexity" "complexity" NOT NULL,
	"gap" "gap_level" NOT NULL,
	"man_days" double precision NOT NULL,
	"sdk_gaps" text,
	"status" "use_case_status" NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp,
	"assigned_developer_ids" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"use_case_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"estimated_hours" integer NOT NULL,
	"assigned_developer_ids" text[],
	"status" "task_status" NOT NULL,
	"dependencies" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dependencies" (
	"from_use_case_id" text NOT NULL,
	"to_use_case_id" text NOT NULL,
	"type" "dependency_type" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_use_case_id_use_cases_id_fk" FOREIGN KEY ("use_case_id") REFERENCES "public"."use_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dependencies" ADD CONSTRAINT "dependencies_from_use_case_id_use_cases_id_fk" FOREIGN KEY ("from_use_case_id") REFERENCES "public"."use_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dependencies" ADD CONSTRAINT "dependencies_to_use_case_id_use_cases_id_fk" FOREIGN KEY ("to_use_case_id") REFERENCES "public"."use_cases"("id") ON DELETE cascade ON UPDATE no action;