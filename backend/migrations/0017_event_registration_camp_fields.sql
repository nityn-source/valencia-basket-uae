ALTER TABLE "event_registrations" ADD COLUMN IF NOT EXISTS "camp" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN IF NOT EXISTS "gender" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN IF NOT EXISTS "whatsapp" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN IF NOT EXISTS "utm_source" text DEFAULT 'direct' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN IF NOT EXISTS "utm_medium" text DEFAULT 'direct' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN IF NOT EXISTS "utm_campaign" text DEFAULT 'direct' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN IF NOT EXISTS "landing_page" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN IF NOT EXISTS "referrer" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN IF NOT EXISTS "source_page" text DEFAULT '' NOT NULL;