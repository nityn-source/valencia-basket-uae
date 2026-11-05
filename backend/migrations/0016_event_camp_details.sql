ALTER TABLE "events" ADD COLUMN "details" jsonb;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "registration_mode" text DEFAULT 'internal' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "registration_open" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "registration_closes" text;