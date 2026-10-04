import type { InferSelectModel } from "drizzle-orm";
import type { coupons } from "@/db/schema";

export type Coupon = InferSelectModel<typeof coupons>;

export type CouponCheck = { ok: true; discount: number } | { ok: false; error: string };

/**
 * Pure rules check for a coupon (no database access).
 * Usage-limit counts are checked separately, inside the order transaction.
 */
export function evaluateCoupon(coupon: Coupon | null | undefined, subtotal: number, now = new Date()): CouponCheck {
  if (!coupon || !coupon.isActive) return { ok: false, error: "This coupon code is not valid." };
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, error: "This coupon is not active yet." };
  if (coupon.expiresAt && coupon.expiresAt < now) return { ok: false, error: "This coupon has expired." };
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, error: "This coupon has reached its usage limit." };
  }
  if (subtotal < coupon.minOrderAmount) {
    return { ok: false, error: `Add items worth ৳${(coupon.minOrderAmount - subtotal).toLocaleString("en-US")} more to use this coupon (minimum order ৳${coupon.minOrderAmount.toLocaleString("en-US")}).` };
  }
  let discount =
    coupon.discountType === "percent"
      ? Math.floor((subtotal * coupon.discountValue) / 100)
      : coupon.discountValue;
  if (coupon.maxDiscountAmount != null) discount = Math.min(discount, coupon.maxDiscountAmount);
  discount = Math.max(0, Math.min(discount, subtotal));
  if (discount <= 0) return { ok: false, error: "This coupon gives no discount on your order." };
  return { ok: true, discount };
}
