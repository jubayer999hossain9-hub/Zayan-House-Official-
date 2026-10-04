"use server";

import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { coupons, couponUsages } from "@/db/schema";
import { adminOnly, flashRedirect, uniqueViolation } from "@/lib/admin-form";
import { zodFieldErrors, type FormState } from "@/lib/validation";

const optInt = (label: string, min = 0) =>
  z.union([z.literal(""), z.coerce.number({ message: `${label} must be a number` }).int(`${label} must be a whole number`).min(min, `${label} is too small`)]).transform((v) => (v === "" ? null : Number(v)));

const optDate = z.string().trim().transform((v, ctx) => {
  if (v === "") return null;
  // The admin types Bangladesh time (UTC+6); store it as the correct moment.
  const d = new Date(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? `${v}:00+06:00` : v);
  if (Number.isNaN(d.getTime())) { ctx.addIssue({ code: "custom", message: "Enter a valid date" }); return z.NEVER; }
  return d;
});

const schema = z.object({
  id: z.coerce.number().int().positive().optional(),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "Use 3 to 30 letters, numbers, - or _ (no spaces)"),
  description: z.string().trim().max(200).transform((v) => v || null),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.coerce.number({ message: "Enter the discount" }).int("Whole numbers only").min(1, "Discount must be at least 1"),
  minOrderAmount: optInt("Minimum order").transform((v) => v ?? 0),
  maxDiscountAmount: optInt("Maximum discount", 1),
  startsAt: optDate,
  expiresAt: optDate,
  isActive: z.boolean(),
  usageLimit: optInt("Usage limit", 1),
  perCustomerLimit: optInt("Per-customer limit", 1),
}).refine((d) => d.discountType !== "percent" || d.discountValue <= 100, { path: ["discountValue"], message: "A percentage cannot be more than 100" })
  .refine((d) => !d.startsAt || !d.expiresAt || d.expiresAt > d.startsAt, { path: ["expiresAt"], message: "Expiry must be after the start date" });

export async function saveCoupon(_prev: FormState, formData: FormData): Promise<FormState> {
  await adminOnly();
  const parsed = schema.safeParse({
    id: formData.get("id") || undefined, code: formData.get("code") ?? "", description: formData.get("description") ?? "",
    discountType: formData.get("discountType") ?? "percent", discountValue: formData.get("discountValue") ?? "",
    minOrderAmount: formData.get("minOrderAmount") ?? "", maxDiscountAmount: formData.get("maxDiscountAmount") ?? "",
    startsAt: formData.get("startsAt") ?? "", expiresAt: formData.get("expiresAt") ?? "", isActive: formData.get("isActive") === "on",
    usageLimit: formData.get("usageLimit") ?? "", perCustomerLimit: formData.get("perCustomerLimit") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error), error: "Please fix the highlighted fields." };
  const { id, ...values } = parsed.data;
  try {
    if (id) {
      const updated = await db.update(coupons).set(values).where(eq(coupons.id, id)).returning({ id: coupons.id });
      if (updated.length === 0) return { error: "This coupon no longer exists." };
    } else {
      await db.insert(coupons).values(values);
    }
  } catch (error) {
    if (uniqueViolation(error)) return { fieldErrors: { code: "This coupon code already exists" } };
    console.error("saveCoupon failed:", error);
    return { error: "Could not save the coupon. Please try again." };
  }
  flashRedirect("/admin/coupons", "ok", id ? "Coupon saved." : "Coupon created.");
}

export async function toggleCoupon(formData: FormData) {
  await adminOnly();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  await db.update(coupons).set({ isActive: sql`not ${coupons.isActive}` }).where(eq(coupons.id, id));
  flashRedirect("/admin/coupons", "ok", "Coupon updated.");
}

export async function deleteCoupon(formData: FormData) {
  await adminOnly();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int`.mapWith(Number) }).from(couponUsages).where(eq(couponUsages.couponId, id));
  if (n > 0) return flashRedirect("/admin/coupons", "error", "This coupon has been used on orders, so it cannot be deleted. Deactivate it instead.");
  await db.delete(coupons).where(eq(coupons.id, id));
  flashRedirect("/admin/coupons", "ok", "Coupon deleted.");
}
