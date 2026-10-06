CREATE TABLE "bd_districts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_bn" varchar(100),
	CONSTRAINT "bd_districts_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "bd_post_offices" (
	"id" serial PRIMARY KEY NOT NULL,
	"thana_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"name_bn" varchar(120),
	"post_code" varchar(4) DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bd_thanas" (
	"id" serial PRIMARY KEY NOT NULL,
	"district_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_bn" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "home_banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_url" varchar(500) NOT NULL,
	"heading" varchar(160) DEFAULT '' NOT NULL,
	"subtext" varchar(300) DEFAULT '' NOT NULL,
	"button_text" varchar(60) DEFAULT '' NOT NULL,
	"button_link" varchar(300) DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "home_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"mime" varchar(40) NOT NULL,
	"data" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "home_video" (
	"id" integer PRIMARY KEY NOT NULL,
	"video_url" varchar(500) DEFAULT '' NOT NULL,
	"poster_url" varchar(500) DEFAULT '' NOT NULL,
	"title" varchar(160) DEFAULT '' NOT NULL,
	"description" varchar(600) DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"position" varchar(40) DEFAULT 'after_categories' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bd_post_offices" ADD CONSTRAINT "bd_post_offices_thana_id_bd_thanas_id_fk" FOREIGN KEY ("thana_id") REFERENCES "public"."bd_thanas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bd_thanas" ADD CONSTRAINT "bd_thanas_district_id_bd_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."bd_districts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bd_post_offices_uq" ON "bd_post_offices" USING btree ("thana_id","name","post_code");--> statement-breakpoint
CREATE UNIQUE INDEX "bd_thanas_district_name_uq" ON "bd_thanas" USING btree ("district_id","name");