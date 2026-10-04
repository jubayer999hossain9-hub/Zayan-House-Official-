"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { settings, deliveryZones, categories } from "@/db/schema";
import { adminOnly, flashRedirect, uniqueViolation } from "@/lib/admin-form";
import { slugify } from "@/lib/slug";
import { zodFieldErrors, type FormState } from "@/lib/validation";

/* ---------------- Settings ---------------- */
const emptyToNull = (max: number) => z.string().trim().max(max);
const urlOrEmpty = z.string().trim().max(300).refine((v) => v === "" || /^https:\/\/[^\s]+$/.test(v), "Use a full link starting with https://");

const internalOrHttpsLink = z.string().trim().max(300).refine((v) => v === "" || v.startsWith("/") && !v.startsWith("//") || /^https:\/\/[^\s]+$/.test(v), "Use a link that starts with / (inside your shop) or https://");
const heroShape: Record<string, z.ZodTypeAny> = {};
for (const n of [1, 2, 3]) {
  heroShape[`s${n}Eyebrow`] = z.string().trim().max(60);
  heroShape[`s${n}Title`] = z.string().trim().max(60);
  heroShape[`s${n}Accent`] = z.string().trim().max(30);
  heroShape[`s${n}Text`] = z.string().trim().max(220);
  heroShape[`s${n}Button`] = z.string().trim().max(30);
  heroShape[`s${n}Link`] = internalOrHttpsLink;
}

const GROUPS = {
  general: z.object({
    siteName: z.string().trim().min(1, "Enter the shop name").max(60),
    tagline: emptyToNull(120),
    contactEmail: z.string().trim().max(200).refine((v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Enter a valid email address"),
    contactPhone: emptyToNull(30),
    address: emptyToNull(200),
  }),
  announcement: z.object({ enabled: z.boolean(), text: emptyToNull(200) }),
  whatsapp: z.object({
    number: z.string().trim().transform((v) => v.replace(/\D/g, "")).refine((v) => v === "" || (v.length >= 8 && v.length <= 15), "Enter the number with country code, digits only (e.g. 8801XXXXXXXXX)"),
    message: emptyToNull(300),
  }),
  social: z.object({ facebook: urlOrEmpty, instagram: urlOrEmpty }),
  payment: z.object({ codEnabled: z.boolean(), codInstructions: emptyToNull(300) }),
  orders: z.object({ orderPrefix: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,6}$/, "Use 2 to 6 letters or numbers") }),
  hero: z.object(heroShape),
  promo: z.object({
    enabled: z.boolean(), eyebrow: z.string().trim().max(60), title: z.string().trim().max(80),
    text: z.string().trim().max(160), button: z.string().trim().max(30), link: internalOrHttpsLink,
  }),
  pages: z.object({
    about: z.string().max(20000), shipping: z.string().max(20000), returns: z.string().max(20000),
    privacy: z.string().max(20000), terms: z.string().max(20000),
  }),
  inventory: z.object({ lowStockThreshold: z.coerce.number({ message: "Enter a number" }).int("Whole number only").min(0).max(1000) }),
} as const;

const testimonialsSchema = z.object({
  items: z.array(z.object({ name: z.string().trim().min(1, "Every review needs a name").max(60), city: z.string().trim().max(60).optional(), text: z.string().trim().min(1, "Every review needs some text").max(300) })).max(6),
});

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await adminOnly();
  const group = String(formData.get("group") ?? "");
  let value: unknown;

  if (group === "testimonials") {
    let raw: unknown = [];
    try { raw = JSON.parse(String(formData.get("items") ?? "[]")); } catch { return { error: "Could not read the reviews." }; }
    const p = testimonialsSchema.safeParse({ items: raw });
    if (!p.success) return { error: p.error.issues[0].message };
    value = p.data;
  } else if (group in GROUPS) {
    const schema = GROUPS[group as keyof typeof GROUPS];
    const input: Record<string, unknown> = {};
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    for (const key of Object.keys(shape)) {
      const raw = formData.get(key);
      input[key] = shape[key] instanceof z.ZodBoolean ? raw === "on" : (raw ?? "");
    }
    const p = schema.safeParse(input);
    if (!p.success) return { fieldErrors: zodFieldErrors(p.error) };
    value = p.data;
  } else {
    return { error: "Unknown settings section." };
  }

  await db.insert(settings).values({ key: group, value: value as object, updatedBy: admin.id })
    .onConflictDoUpdate({ target: settings.key, set: { value: value as object, updatedBy: admin.id, updatedAt: new Date() } });
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------------- Delivery ---------------- */
const zoneSchema = z.object({
  id: z.coerce.number().int().positive(),
  charge: z.coerce.number({ message: "Enter the charge" }).int("Whole numbers only").min(0).max(100000),
  freeDeliveryThreshold: z.union([z.literal(""), z.coerce.number().int().min(1, "Must be at least 1")]).transform((v) => (v === "" ? null : Number(v))),
  isActive: z.boolean(),
});

export async function saveZone(formData: FormData) {
  await adminOnly();
  const p = zoneSchema.safeParse({
    id: formData.get("id"), charge: formData.get("charge"), freeDeliveryThreshold: formData.get("freeDeliveryThreshold") ?? "", isActive: formData.get("isActive") === "on",
  });
  if (!p.success) return flashRedirect("/admin/delivery", "error", p.error.issues[0].message);
  await db.update(deliveryZones).set({ charge: p.data.charge, freeDeliveryThreshold: p.data.freeDeliveryThreshold, isActive: p.data.isActive }).where(eq(deliveryZones.id, p.data.id));
  revalidatePath("/", "layout");
  flashRedirect("/admin/delivery", "ok", "Delivery settings saved.");
}

/* ---------------- Categories ---------------- */
const categorySchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(2, "Enter a name").max(80),
  slug: z.string().trim().toLowerCase().max(80),
  description: z.string().trim().max(300).transform((v) => v || null),
  displayOrder: z.coerce.number({ message: "Enter a number" }).int("Whole number only").min(0).max(10000),
  isActive: z.boolean(),
  seoTitle: z.string().trim().max(120).transform((v) => v || null),
  seoDescription: z.string().trim().max(300).transform((v) => v || null),
  imageUrl: z.string().trim().max(500).refine((v) => v === "" || /^\/media\/\d+$/.test(v) || /^https:\/\/[^\s]+$/.test(v), "Use an uploaded image or an https:// link").transform((v) => v || null),
});

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  await adminOnly();
  const p = categorySchema.safeParse({
    id: formData.get("id") || undefined, name: formData.get("name") ?? "", slug: formData.get("slug") ?? "", description: formData.get("description") ?? "",
    displayOrder: formData.get("displayOrder") || "0", isActive: formData.get("isActive") === "on", seoTitle: formData.get("seoTitle") ?? "", seoDescription: formData.get("seoDescription") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
  });
  if (!p.success) return { fieldErrors: zodFieldErrors(p.error) };
  const { id, ...rest } = p.data;
  const slug = slugify(rest.slug || rest.name);
  if (!slug) return { fieldErrors: { slug: "Enter a web address using letters or numbers" } };
  try {
    if (id) {
      const u = await db.update(categories).set({ ...rest, slug }).where(eq(categories.id, id)).returning({ id: categories.id });
      if (u.length === 0) return { error: "This category no longer exists." };
    } else {
      await db.insert(categories).values({ ...rest, slug });
    }
  } catch (error) {
    if (uniqueViolation(error)) return { fieldErrors: { slug: "This web address is already used by another category" } };
    console.error("saveCategory failed:", error);
    return { error: "Could not save the category." };
  }
  revalidatePath("/", "layout");
  flashRedirect("/admin/categories", "ok", id ? "Category saved." : "Category created.");
}

export async function deleteCategory(formData: FormData) {
  await adminOnly();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const [{ n }] = await db.execute<{ n: number }>(sql`select count(*)::int as n from products where category_id = ${id}`).then((r) => r.rows as { n: number }[]);
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/", "layout");
  flashRedirect("/admin/categories", "ok", n > 0 ? `Category deleted. ${n} product${n === 1 ? " is" : "s are"} now without a category.` : "Category deleted.");
}
