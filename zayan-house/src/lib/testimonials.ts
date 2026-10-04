import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

export type Testimonial = { name: string; city?: string; text: string };

/** Customer testimonials live in the `testimonials` setting (edited in Admin > Settings). Empty = section hidden. */
export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const [row] = await db.select().from(settings).where(eq(settings.key, "testimonials")).limit(1);
    const items = (row?.value as { items?: unknown } | undefined)?.items;
    if (!Array.isArray(items)) return [];
    return items
      .filter((t): t is Testimonial => !!t && typeof t.name === "string" && typeof t.text === "string")
      .slice(0, 6);
  } catch {
    return [];
  }
}
