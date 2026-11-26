ALTER TABLE "event_registrations" ADD COLUMN "camp" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "gender" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "whatsapp" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "utm_source" text DEFAULT 'direct' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "utm_medium" text DEFAULT 'direct' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "utm_campaign" text DEFAULT 'direct' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "landing_page" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "referrer" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "source_page" text DEFAULT '' NOT NULL;