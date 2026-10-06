import "server-only";
import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { homeBanners, homeVideo } from "@/db/schema-home";

export async function getAllBanners() {
  return db.select().from(homeBanners).orderBy(asc(homeBanners.sortOrder), asc(homeBanners.id));
}

export async function getActiveBanners() {
  return db
    .select()
    .from(homeBanners)
    .where(eq(homeBanners.isActive, true))
    .orderBy(asc(homeBanners.sortOrder), asc(homeBanners.id));
}

// cache() = one database read per page even though several slots ask for it
export const getHomeVideo = cache(async () => {
  const [row] = await db.select().from(homeVideo).where(eq(homeVideo.id, 1)).limit(1);
  return row ?? null;
});
