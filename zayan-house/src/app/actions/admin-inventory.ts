"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { adminOnly, flashRedirect } from "@/lib/admin-form";

/** Sets the exact stock for a variant or (for products without variants) a product. */
export async function setStock(formData: FormData) {
  await adminOnly();
  const kind = formData.get("kind");
  const id = Number(formData.get("id"));
  const stock = Number(formData.get("stock"));
  const back = String(formData.get("back") ?? "/admin/inventory");
  const safeBack = back.startsWith("/admin/inventory") ? back : "/admin/inventory";
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(stock) || stock < 0 || stock > 100000) {
    return flashRedirect(safeBack, "error", "Stock must be a whole number from 0 up.");
  }
  if (kind === "variant") await db.update(productVariants).set({ stock }).where(eq(productVariants.id, id));
  else if (kind === "product") await db.update(products).set({ stock }).where(eq(products.id, id));
  else return flashRedirect(safeBack, "error", "Unknown item.");
  revalidatePath("/", "layout");
  flashRedirect(safeBack, "ok", "Stock updated.");
}
