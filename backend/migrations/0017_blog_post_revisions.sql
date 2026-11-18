CREATE TABLE "blog_post_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"featured_image_src" text,
	"featured_image_alt" text,
	"meta_title" text,
	"meta_description" text,
	"word_count" integer DEFAULT 0 NOT NULL,
	"saved_by" text,
	"reason" text DEFAULT 'update' NOT NULL,
	"restored_from_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blog_post_revisions" ADD CONSTRAINT "blog_post_revisions_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_blog_post_revisions_post" ON "blog_post_revisions" USING btree ("post_id","created_at" DESC);