CREATE TABLE "effort_config" (
	"id" text PRIMARY KEY NOT NULL,
	"complexity_weights" jsonb NOT NULL,
	"gap_weights" jsonb NOT NULL,
	"formula_params" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
