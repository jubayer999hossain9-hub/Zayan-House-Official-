import {
  pgTable, serial, integer, varchar, text, boolean, timestamp, uniqueIndex,
} from "drizzle-orm/pg-core";

// Uploaded banner / poster pictures (stored in the database so it works on Vercel)
export const homeMedia = pgTable("home_media", {
  id: serial("id").primaryKey(),
  mime: varchar("mime", { length: 40 }).notNull(),
  data: text("data").notNull(), // base64
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const homeBanners = pgTable("home_banners", {
  id: serial("id").primaryKey(),
  imageUrl: varchar("image_url", { length: 500 }).notNull(),
  heading: varchar("heading", { length: 160 }).notNull().default(""),
  subtext: varchar("subtext", { length: 300 }).notNull().default(""),
  buttonText: varchar("button_text", { length: 60 }).notNull().default(""),
  buttonLink: varchar("button_link", { length: 300 }).notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Always a single row with id = 1
export const homeVideo = pgTable("home_video", {
  id: integer("id").primaryKey(),
  videoUrl: varchar("video_url", { length: 500 }).notNull().default(""),
  posterUrl: varchar("poster_url", { length: 500 }).notNull().default(""),
  title: varchar("title", { length: 160 }).notNull().default(""),
  description: varchar("description", { length: 600 }).notNull().default(""),
  isActive: boolean("is_active").notNull().default(false),
  position: varchar("position", { length: 40 }).notNull().default("after_categories"),
});

export const bdDistricts = pgTable("bd_districts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  nameBn: varchar("name_bn", { length: 100 }),
});

export const bdThanas = pgTable(
  "bd_thanas",
  {
    id: serial("id").primaryKey(),
    districtId: integer("district_id").notNull().references(() => bdDistricts.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    nameBn: varchar("name_bn", { length: 100 }),
  },
  (t) => [uniqueIndex("bd_thanas_district_name_uq").on(t.districtId, t.name)]
);

export const bdPostOffices = pgTable(
  "bd_post_offices",
  {
    id: serial("id").primaryKey(),
    thanaId: integer("thana_id").notNull().references(() => bdThanas.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    nameBn: varchar("name_bn", { length: 120 }),
    postCode: varchar("post_code", { length: 4 }).notNull().default(""),
  },
  (t) => [uniqueIndex("bd_post_offices_uq").on(t.thanaId, t.name, t.postCode)]
);
