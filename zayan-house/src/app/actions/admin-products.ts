"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { products, productVariants, productImages, media } from "@/db/schema";
import { adminOnly, flashRedirect, uniqueViolation } from "@/lib/admin-form";
import { slugify } from "@/lib/slug";
import { zodFieldErrors, type FormState } from "@/lib/validation";

const int = (label: string, min = 0) =>
  z.coerce.number({ message: `${label} must be a number` }).int(`${label} must be a whole number`).min(min, `${label} cannot be negative`);

const optionalInt = (label: string) =>
  z.union([z.literal(""), z.null(), z.undefined(), int(label)]).transform((v) => (v === "" || v == null ? null : Number(v)));

const text = (max: number) => z.string().trim().max(max).transform((v) => (v === "" ? null : v));

const variantSchema = z.object({
  id: z.number().int().positive().optional(),
  size: z.string().trim().max(20).transform((v) => v || null),
  color: z.string().trim().max(40).transform((v) => v || null),
  colorHex: z.string().trim().transform((v) => v || null).refine((v) => v === null || /^#[0-9a-fA-F]{6}$/.test(v), "Colour code must look like #0F3D35"),
  sku: z.string().trim().min(2, "Every variant needs a SKU").max(60),
  price: optionalInt("Variant price"),
  stock: int("Variant stock"),
  status: z.enum(["active", "inactive"]),
});

const productSchema = z
  .object({
    id: z.coerce.number().int().positive().optional(),
    name: z.string().trim().min(2, "Enter the product name").max(200),
    slug: z.string().trim().toLowerCase().max(100),
    sku: z.string().trim().min(2, "Enter a SKU").max(60),
    categoryId: z.union([z.literal(""), z.coerce.number().int().positive()]).transform((v) => (v === "" ? null : v)),
    shortDescription: text(300),
    description: text(5000),
    productDetails: text(3000),
    regularPrice: z.string().trim().min(1, "Enter the regular price").transform((v) => Number(v)).pipe(z.number({ message: "Regular price must be a number" }).int("Regular price must be a whole number").min(0, "Regular price cannot be negative")),
    salePrice: optionalInt("Sale price"),
    costPrice: optionalInt("Cost price"),
    stock: int("Stock"),
    status: z.enum(["draft", "active", "archived"]),
    isFeatured: z.boolean(),
    isBestseller: z.boolean(),
    isNewArrival: z.boolean(),
    seoTitle: text(120),
    seoDescription: text(300),
  })
  .refine((d) => d.salePrice === null || d.salePrice <= d.regularPrice, { path: ["salePrice"], message: "Sale price must not be higher than the regular price" });

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  await adminOnly();

  const parsed = productSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    sku: formData.get("sku") ?? "",
    categoryId: formData.get("categoryId") ?? "",
    shortDescription: formData.get("shortDescription") ?? "",
    description: formData.get("description") ?? "",
    productDetails: formData.get("productDetails") ?? "",
    regularPrice: formData.get("regularPrice") ?? "",
    salePrice: formData.get("salePrice") ?? "",
    costPrice: formData.get("costPrice") ?? "",
    stock: formData.get("stock") || "0",
    status: formData.get("status") ?? "draft",
    isFeatured: formData.get("isFeatured") === "on",
    isBestseller: formData.get("isBestseller") === "on",
    isNewArrival: formData.get("isNewArrival") === "on",
    seoTitle: formData.get("seoTitle") ?? "",
    seoDescription: formData.get("seoDescription") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error), error: "Please fix the highlighted fields." };

  let variantsRaw: unknown = [];
  try {
    variantsRaw = JSON.parse(String(formData.get("variants") ?? "[]"));
  } catch {
    return { error: "The variants could not be read. Please reload the page." };
  }
  const vParsed = z.array(variantSchema).max(100).safeParse(variantsRaw);
  if (!vParsed.success) {
    const issue = vParsed.error.issues[0];
    return { error: `Variant row ${Number(issue.path[0]) + 1}: ${issue.message}` };
  }
  const variants = vParsed.data;
  const skuSet = new Set<string>();
  for (const [i, v] of variants.entries()) {
    if (!v.size && !v.color) return { error: `Variant row ${i + 1}: enter a size or a colour.` };
    const key = v.sku.toLowerCase();
    if (skuSet.has(key)) return { error: `Variant SKU "${v.sku}" is used twice in this product.` };
    skuSet.add(key);
  }
  const combos = new Set<string>();
  for (const [i, v] of variants.entries()) {
    const key = `${(v.size ?? "").toLowerCase()}|${(v.color ?? "").toLowerCase()}`;
    if (combos.has(key)) return { error: `Variant row ${i + 1}: this size and colour combination already exists.` };
    combos.add(key);
  }

  const d = parsed.data;
  const slug = slugify(d.slug || d.name);
  if (!slug) return { fieldErrors: { slug: "Enter a web address (slug) using letters or numbers" } };

  let savedId: number;
  try {
    savedId = await db.transaction(async (tx) => {
      const values = {
        name: d.name, slug, sku: d.sku, categoryId: d.categoryId, shortDescription: d.shortDescription, description: d.description,
        productDetails: d.productDetails, regularPrice: d.regularPrice, salePrice: d.salePrice, costPrice: d.costPrice,
        stock: d.stock, status: d.status, isFeatured: d.isFeatured, isBestseller: d.isBestseller, isNewArrival: d.isNewArrival,
        seoTitle: d.seoTitle, seoDescription: d.seoDescription,
      };
      let id: number;
      if (d.id) {
        const updated = await tx.update(products).set(values).where(eq(products.id, d.id)).returning({ id: products.id });
        if (updated.length === 0) throw new Error("NOT_FOUND");
        id = d.id;
      } else {
        const [created] = await tx.insert(products).values(values).returning({ id: products.id });
        id = created.id;
      }

      const existing = await tx.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.productId, id));
      const keepIds = variants.map((v) => v.id).filter((x): x is number => x != null);
      const toDelete = existing.map((e) => e.id).filter((x) => !keepIds.includes(x));
      if (toDelete.length) await tx.delete(productVariants).where(inArray(productVariants.id, toDelete));
      for (const v of variants) {
        const row = { size: v.size, color: v.color, colorHex: v.colorHex, sku: v.sku, price: v.price, stock: v.stock, status: v.status };
        if (v.id && existing.some((e) => e.id === v.id)) {
          await tx.update(productVariants).set(row).where(and(eq(productVariants.id, v.id), eq(productVariants.productId, id)));
        } else {
          await tx.insert(productVariants).values({ ...row, productId: id });
        }
      }
      return id;
    });
  } catch (error) {
    const constraint = uniqueViolation(error);
    if (constraint) {
      if (constraint.includes("slug")) return { fieldErrors: { slug: "This web address is already used by another product" } };
      if (constraint.includes("variants")) return { error: "A variant SKU is already used by another product." };
      return { fieldErrors: { sku: "This SKU is already used by another product" } };
    }
    if (error instanceof Error && error.message === "NOT_FOUND") return { error: "This product no longer exists." };
    console.error("saveProduct failed:", error);
    return { error: "We could not save the product. Please try again." };
  }

  revalidatePath("/", "layout");
  flashRedirect(`/admin/products/${savedId}`, "ok", d.id ? "Product saved." : "Product created. You can now add photos.");
}

export async function deleteProduct(formData: FormData) {
  await adminOnly();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const imgs = await db.select({ url: productImages.url }).from(productImages).where(eq(productImages.productId, id));
  await db.delete(products).where(eq(products.id, id));
  await deleteMediaFor(imgs.map((i) => i.url));
  revalidatePath("/", "layout");
  flashRedirect("/admin/products", "ok", "Product deleted.");
}

/* ---------- Images ---------- */
async function deleteMediaFor(urls: string[]) {
  const ids = urls.map((u) => /^\/media\/(\d+)$/.exec(u)?.[1]).filter((x): x is string => !!x).map(Number);
  if (ids.length) {
    // Only remove files nothing else still uses.
    for (const id of ids) {
      const [still] = await db.select({ id: productImages.id }).from(productImages).where(eq(productImages.url, `/media/${id}`)).limit(1);
      if (!still) await db.delete(media).where(eq(media.id, id));
    }
  }
}

const imageUrlSchema = z.string().trim().max(500).refine((u) => /^\/media\/\d+$/.test(u) || /^https:\/\/[^\s]+$/.test(u), "Use an uploaded image or an https:// link");

export async function addProductImage(productId: number, url: string): Promise<{ ok: boolean; error?: string }> {
  await adminOnly();
  const parsed = imageUrlSchema.safeParse(url);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const [p] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1);
  if (!p) return { ok: false, error: "Product not found." };
  const [{ next }] = await db.select({ next: sql<number>`coalesce(max(${productImages.position}), -1) + 1`.mapWith(Number) }).from(productImages).where(eq(productImages.productId, productId));
  await db.insert(productImages).values({ productId, url: parsed.data, position: next });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeProductImage(imageId: number) {
  await adminOnly();
  const [img] = await db.delete(productImages).where(eq(productImages.id, imageId)).returning({ url: productImages.url });
  if (img) await deleteMediaFor([img.url]);
  revalidatePath("/", "layout");
}

/** direction: "first" | "up" | "down". Re-numbers the product's images so the order is always clean. */
export async function moveProductImage(imageId: number, direction: "first" | "up" | "down") {
  await adminOnly();
  const [img] = await db.select({ productId: productImages.productId }).from(productImages).where(eq(productImages.id, imageId)).limit(1);
  if (!img) return;
  const list = await db.select({ id: productImages.id }).from(productImages).where(eq(productImages.productId, img.productId)).orderBy(asc(productImages.position), asc(productImages.id));
  const ids = list.map((l) => l.id);
  const i = ids.indexOf(imageId);
  if (direction === "first") { ids.splice(i, 1); ids.unshift(imageId); }
  else if (direction === "up" && i > 0) [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
  else if (direction === "down" && i < ids.length - 1) [ids[i + 1], ids[i]] = [ids[i], ids[i + 1]];
  await db.transaction(async (tx) => {
    for (const [pos, id] of ids.entries()) await tx.update(productImages).set({ position: pos }).where(eq(productImages.id, id));
  });
  revalidatePath("/", "layout");
}
