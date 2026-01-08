CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
ALTER TABLE "use_cases" ALTER COLUMN "priority" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "use_cases" ALTER COLUMN "priority" SET DATA TYPE "public"."priority" USING (
  CASE 
    WHEN "priority" <= 0 THEN 'low'::priority
    WHEN "priority" <= 5 THEN 'medium'::priority
    ELSE 'high'::priority
  END
);--> statement-breakpoint
ALTER TABLE "use_cases" ALTER COLUMN "priority" SET DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "public"."use_cases" ALTER COLUMN "gap" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."gap_level";--> statement-breakpoint
CREATE TYPE "public"."gap_level" AS ENUM('sdk-native', 'minor-extension', 'moderate-extension', 'significant-extension', 'custom-implementation');--> statement-breakpoint
ALTER TABLE "public"."use_cases" ALTER COLUMN "gap" SET DATA TYPE "public"."gap_level" USING (
  CASE "gap"
    WHEN '1' THEN 'sdk-native'::gap_level
    WHEN '2' THEN 'minor-extension'::gap_level
    WHEN '3' THEN 'moderate-extension'::gap_level
    WHEN '4' THEN 'significant-extension'::gap_level
    WHEN '5' THEN 'custom-implementation'::gap_level
    ELSE 'moderate-extension'::gap_level
  END
);