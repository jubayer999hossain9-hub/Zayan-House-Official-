"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orders, orderItems, products, productVariants, coupons, couponUsages, payments } from "@/db/schema";
import { adminOnly, flashRedirect } from "@/lib/admin-form";

const schema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
  adminNotes: z.string().trim().max(2000).transform((v) => (v === "" ? null : v)),
});

class OrderUpdateError extends Error {}

export async function updateOrder(formData: FormData) {
  await adminOnly();
  const parsed = schema.safeParse({
    id: formData.get("id"), status: formData.get("status"), paymentStatus: formData.get("paymentStatus"), adminNotes: formData.get("adminNotes") ?? "",
  });
  if (!parsed.success) return flashRedirect("/admin/orders", "error", "Invalid order update.");
  const d = parsed.data;
  const back = `/admin/orders/${d.id}`;

  let message = "Order updated.";
  try {
    message = await db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, d.id)).limit(1).for("update");
      if (!order) throw new OrderUpdateError("Order not found.");
      if (order.status === "cancelled" && d.status !== "cancelled") {
        throw new OrderUpdateError("A cancelled order cannot be reopened (its stock was returned). Ask the customer to place a new order.");
      }

      let paymentStatus = d.paymentStatus;
      const notes: string[] = [];
      // Cash on Delivery is paid when the parcel is handed over, unless you set the payment yourself.
      if (d.status === "delivered" && order.status !== "delivered" && order.paymentMethod === "cod" && paymentStatus === order.paymentStatus && paymentStatus === "pending") {
        paymentStatus = "paid";
        notes.push("payment marked as paid (Cash on Delivery)");
      }

      if (d.status === "cancelled" && order.status !== "cancelled" && !order.stockRestored) {
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        for (const i of items) {
          if (i.variantId != null) {
            await tx.update(productVariants).set({ stock: sql`${productVariants.stock} + ${i.quantity}` }).where(eq(productVariants.id, i.variantId));
          } else if (i.productId != null) {
            const [{ n }] = await tx.select({ n: sql<number>`count(*)::int`.mapWith(Number) }).from(productVariants).where(eq(productVariants.productId, i.productId));
            if (n === 0) await tx.update(products).set({ stock: sql`${products.stock} + ${i.quantity}` }).where(eq(products.id, i.productId));
          }
          if (i.productId != null) await tx.update(products).set({ soldCount: sql`greatest(${products.soldCount} - ${i.quantity}, 0)` }).where(eq(products.id, i.productId));
        }
        const usages = await tx.delete(couponUsages).where(eq(couponUsages.orderId, order.id)).returning({ couponId: couponUsages.couponId });
        for (const u of usages) await tx.update(coupons).set({ usedCount: sql`greatest(${coupons.usedCount} - 1, 0)` }).where(eq(coupons.id, u.couponId));
        notes.push("stock returned to inventory");
      }

      await tx.update(orders).set({
        status: d.status, paymentStatus, adminNotes: d.adminNotes,
        stockRestored: order.stockRestored || (d.status === "cancelled"),
      }).where(and(eq(orders.id, order.id)));
      await tx.update(payments).set({ status: paymentStatus }).where(eq(payments.orderId, order.id));
      return notes.length ? `Order updated: ${notes.join(", ")}.` : "Order updated.";
    });
  } catch (error) {
    if (error instanceof OrderUpdateError) return flashRedirect(back, "error", error.message);
    console.error("updateOrder failed:", error);
    return flashRedirect(back, "error", "Could not update the order. Please try again.");
  }
  revalidatePath("/account", "layout");
  flashRedirect(back, "ok", message);
}
