import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { randomInt } from "node:crypto";
import { db } from "@/db";
import {
  products, productImages, productVariants, deliveryZones, coupons, couponUsages,
  customers, customerAddresses, orders, orderItems, payments,
} from "@/db/schema";
import { evaluateCoupon } from "./coupons";
import { unitPriceFor } from "./pricing-utils";
import { mergeLines, deliveryFor, type CartLineInput } from "./cart-resolve";
import { zoneSlugForDistrict } from "./districts";

/** An error whose message is safe and useful to show to the customer. */
export class OrderError extends Error {}

export type CheckoutData = {
  items: CartLineInput[];
  name: string;
  phone: string;
  email: string | null;
  address: string;
  area: string | null;
  city: string;
  district: string;
  postalCode: string | null;
  notes: string | null;
  couponCode: string | null;
  saveAddress: boolean;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(length: number) {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/**
 * Creates an order. Everything happens in ONE database transaction:
 * prices, stock, delivery and coupon are all re-checked on the server, and stock is locked
 * while it is checked and reduced. If anything fails, nothing is saved.
 */
export async function createOrder(
  data: CheckoutData,
  ctx: { userId: number | null; customerId: number | null; orderPrefix: string },
) {
  const items = mergeLines(data.items);
  if (items.length === 0) throw new OrderError("Your cart is empty.");

  return db.transaction(async (tx) => {
    /* ---- 1. Load and lock the products / variants being bought ---- */
    const productIds = [...new Set(items.map((i) => i.productId))].sort((a, b) => a - b);
    const variantIds = items.map((i) => i.variantId).filter((v): v is number => v != null).sort((a, b) => a - b);

    const productRows = await tx.select().from(products).where(inArray(products.id, productIds)).orderBy(products.id).for("update");
    const variantRows = variantIds.length
      ? await tx.select().from(productVariants).where(inArray(productVariants.id, variantIds)).orderBy(productVariants.id).for("update")
      : [];
    const activeVariantCounts = await tx
      .select({ productId: productVariants.productId, n: sql<number>`count(*)::int`.mapWith(Number) })
      .from(productVariants)
      .where(and(inArray(productVariants.productId, productIds), eq(productVariants.status, "active")))
      .groupBy(productVariants.productId);
    const imageRows = await tx
      .select({ productId: productImages.productId, url: productImages.url })
      .from(productImages)
      .where(inArray(productImages.productId, productIds))
      .orderBy(productImages.position, productImages.id);

    /* ---- 2. Validate every line and price it from the database ---- */
    type Line = {
      productId: number; variantId: number | null; name: string; sku: string; size: string | null;
      color: string | null; imageUrl: string | null; qty: number; unitPrice: number;
    };
    const lines: Line[] = [];
    for (const item of items) {
      const p = productRows.find((r) => r.id === item.productId);
      if (!p || p.status !== "active") throw new OrderError("A product in your cart is no longer available. Please review your cart.");
      const needsVariant = (activeVariantCounts.find((c) => c.productId === p.id)?.n ?? 0) > 0;
      const v = item.variantId != null ? variantRows.find((r) => r.id === item.variantId) : undefined;
      if (needsVariant && (!v || v.productId !== p.id || v.status !== "active")) {
        throw new OrderError(`Please choose an available size/colour for "${p.name}" again.`);
      }
      if (!needsVariant && item.variantId != null) throw new OrderError(`"${p.name}" changed. Please review your cart.`);
      const stock = v ? v.stock : p.stock;
      if (stock < item.qty) {
        throw new OrderError(
          stock <= 0
            ? `Sorry, "${p.name}"${v ? ` (${[v.size, v.color].filter(Boolean).join(", ")})` : ""} is out of stock.`
            : `Sorry, only ${stock} of "${p.name}"${v ? ` (${[v.size, v.color].filter(Boolean).join(", ")})` : ""} left in stock.`,
        );
      }
      lines.push({
        productId: p.id, variantId: v?.id ?? null, name: p.name, sku: v ? v.sku : p.sku,
        size: v?.size ?? null, color: v?.color ?? null,
        imageUrl: imageRows.find((i) => i.productId === p.id)?.url ?? null,
        qty: item.qty, unitPrice: unitPriceFor(p, v).price,
      });
    }
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);

    /* ---- 3. Delivery: decided by the server from the district ---- */
    const zoneSlug = zoneSlugForDistrict(data.district);
    const [zone] = await tx.select().from(deliveryZones).where(and(eq(deliveryZones.slug, zoneSlug), eq(deliveryZones.isActive, true))).limit(1);
    if (!zone) throw new OrderError("Delivery is not available for this area right now. Please contact us on WhatsApp.");
    const deliveryCharge = deliveryFor(
      { slug: zone.slug, name: zone.name, charge: zone.charge, freeThreshold: zone.freeDeliveryThreshold },
      subtotal,
    );

    /* ---- 4. Customer record ---- */
    let customerId = ctx.customerId;
    if (customerId == null) {
      const [guest] = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.phone, data.phone), sql`${customers.userId} is null`))
        .limit(1);
      if (guest) {
        customerId = guest.id;
        await tx.update(customers).set({ name: data.name, email: data.email }).where(eq(customers.id, guest.id));
      } else {
        const [created] = await tx.insert(customers).values({ name: data.name, phone: data.phone, email: data.email }).returning({ id: customers.id });
        customerId = created.id;
      }
    }

    /* ---- 5. Coupon (locked while we check limits) ---- */
    let discount = 0;
    let couponRow: typeof coupons.$inferSelect | null = null;
    if (data.couponCode) {
      const [c] = await tx.select().from(coupons).where(sql`upper(${coupons.code}) = ${data.couponCode.toUpperCase()}`).limit(1).for("update");
      const res = evaluateCoupon(c, subtotal);
      if (!res.ok) throw new OrderError(res.error);
      if (c.perCustomerLimit != null) {
        const [{ n }] = await tx
          .select({ n: sql<number>`count(*)::int`.mapWith(Number) })
          .from(couponUsages)
          .where(and(eq(couponUsages.couponId, c.id), sql`(${couponUsages.phone} = ${data.phone} or ${couponUsages.customerId} = ${customerId})`));
        if (n >= c.perCustomerLimit) throw new OrderError("You have already used this coupon the maximum number of times.");
      }
      discount = res.discount;
      couponRow = c;
    }

    const total = subtotal - discount + deliveryCharge;

    /* ---- 6. Order ---- */
    let order: typeof orders.$inferSelect | undefined;
    for (let attempt = 0; attempt < 5 && !order; attempt++) {
      const orderNumber = `${ctx.orderPrefix}-${randomCode(8)}`;
      const [row] = await tx
        .insert(orders)
        .values({
          orderNumber,
          customerId,
          userId: ctx.userId,
          customerName: data.name,
          phone: data.phone,
          email: data.email,
          shippingAddress: data.address,
          shippingArea: data.area,
          shippingCity: data.city,
          shippingDistrict: data.district,
          shippingPostalCode: data.postalCode,
          deliveryZoneId: zone.id,
          deliveryZoneName: zone.name,
          subtotal,
          discount,
          deliveryCharge,
          total,
          couponCode: couponRow?.code ?? null,
          paymentMethod: "cod",
          paymentStatus: "pending",
          status: "pending",
          notes: data.notes,
        })
        .onConflictDoNothing({ target: orders.orderNumber })
        .returning();
      order = row;
    }
    if (!order) throw new Error("Could not generate a unique order number.");

    await tx.insert(orderItems).values(
      lines.map((l) => ({
        orderId: order.id, productId: l.productId, variantId: l.variantId, productName: l.name, sku: l.sku,
        size: l.size, color: l.color, imageUrl: l.imageUrl, quantity: l.qty, unitPrice: l.unitPrice, lineTotal: l.unitPrice * l.qty,
      })),
    );

    /* ---- 7. Reduce stock (guarded, can never go below zero) ---- */
    for (const l of lines) {
      const updated = l.variantId != null
        ? await tx.update(productVariants).set({ stock: sql`${productVariants.stock} - ${l.qty}` })
            .where(and(eq(productVariants.id, l.variantId), sql`${productVariants.stock} >= ${l.qty}`)).returning({ id: productVariants.id })
        : await tx.update(products).set({ stock: sql`${products.stock} - ${l.qty}` })
            .where(and(eq(products.id, l.productId), sql`${products.stock} >= ${l.qty}`)).returning({ id: products.id });
      if (updated.length === 0) throw new OrderError(`Sorry, "${l.name}" just went out of stock.`);
      await tx.update(products).set({ soldCount: sql`${products.soldCount} + ${l.qty}` }).where(eq(products.id, l.productId));
    }

    /* ---- 8. Coupon usage, payment record, optional saved address ---- */
    if (couponRow) {
      await tx.insert(couponUsages).values({ couponId: couponRow.id, orderId: order.id, customerId, phone: data.phone, discountAmount: discount });
      await tx.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, couponRow.id));
    }
    await tx.insert(payments).values({ orderId: order.id, method: "cod", provider: "cash_on_delivery", amount: total, status: "pending" });

    if (data.saveAddress && ctx.customerId != null) {
      const existing = await tx.select({ id: customerAddresses.id }).from(customerAddresses).where(eq(customerAddresses.customerId, ctx.customerId));
      await tx.insert(customerAddresses).values({
        customerId: ctx.customerId, fullName: data.name, phone: data.phone, address: data.address, area: data.area,
        city: data.city, district: data.district, postalCode: data.postalCode, isDefault: existing.length === 0,
      });
    }

    return { id: order.id, orderNumber: order.orderNumber, total };
  });
}

