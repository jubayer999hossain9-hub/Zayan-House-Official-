import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const fixed: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...["about", "contact", "shipping", "returns", "privacy", "terms"].map((p) => ({
      url: `${SITE_URL}/${p}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.4,
    })),
  ];
  try {
    const [cats, prods] = await Promise.all([
      db.select({ slug: categories.slug, updatedAt: categories.updatedAt }).from(categories).where(eq(categories.isActive, true)),
      db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.status, "active")),
    ]);
    return [
      ...fixed,
      ...cats.map((c) => ({ url: `${SITE_URL}/category/${c.slug}`, lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
      ...prods.map((p) => ({ url: `${SITE_URL}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ];
  } catch (error) {
    console.error("Sitemap could not read the database:", error);
    return fixed;
  }
}
