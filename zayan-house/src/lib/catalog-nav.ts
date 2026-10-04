import "server-only";
import { cache } from "react";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";

export const getActiveCategories = cache(async () => {
  try {
    return await db
      .select({ id: categories.id, name: categories.name, slug: categories.slug, description: categories.description, imageUrl: categories.imageUrl })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.displayOrder), asc(categories.name));
  } catch (error) {
    console.error("Could not load categories:", error);
    return [];
  }
});

/** How many active products each category has (for the "N Products" labels). */
export const getCategoryCounts = cache(async (): Promise<Map<number, number>> => {
  try {
    const rows = await db
      .select({ categoryId: products.categoryId, n: count() })
      .from(products)
      .where(eq(products.status, "active"))
      .groupBy(products.categoryId);
    return new Map(rows.filter((r) => r.categoryId != null).map((r) => [r.categoryId as number, r.n]));
  } catch (error) {
    console.error("Could not count category products:", error);
    return new Map();
  }
});
