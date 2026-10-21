CREATE TABLE "faq_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"section" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "faq_items_slug_unique" UNIQUE("slug")
);
