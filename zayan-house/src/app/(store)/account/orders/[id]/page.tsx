import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { requireCustomer } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { formatDate, PAYMENT_METHOD_LABEL } from "@/lib/order-display";
import { StatusBadge } from "@/components/status-badge";
import { OrderTimeline } from "@/components/order-timeline";
import { ProductImage } from "@/components/product-image";

export const metadata: Metadata = { title: "Order Details", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const customer = await requireCustomer();
  const { id } = await params;
  // Only the owner can see an order. Anyone else gets a plain 404.
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.orderNumber, id.toUpperCase()), eq(orders.userId, customer.id)))
    .limit(1);
  if (!order) notFound();
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(orderItems.id);

  return (
    <div>
      <Link href="/account/orders" className="text-xs font-semibold uppercase tracking-[0.16em] text-green underline">← All orders</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl text-green">Order {order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">Placed on {formatDate(order.createdAt, true)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-8 border border-line bg-cream p-5 sm:p-6"><OrderTimeline status={order.status} /></div>

      <section className="mt-6 border border-line bg-cream p-5 sm:p-6">
        <h2 className="text-2xl text-green">Items</h2>
        <ul className="mt-3 divide-y divide-line">
          {items.map((i) => (
            <li key={i.id} className="flex gap-3 py-4">
              <ProductImage url={i.imageUrl} alt={i.productName} className="h-24 w-[4.5rem] shrink-0 border border-line" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">{i.productName}</p>
                <p className="text-xs text-muted">{[i.size && `Size: ${i.size}`, i.color && `Colour: ${i.color}`].filter(Boolean).join(" · ")}</p>
                <p className="text-xs text-muted">SKU: {i.sku}</p>
                <p className="mt-1 text-xs text-muted">{i.quantity} × {formatPrice(i.unitPrice)}</p>
              </div>
              <p className="text-sm font-semibold">{formatPrice(i.lineTotal)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-success"><dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd>-{formatPrice(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">Delivery{order.deliveryZoneName ? ` (${order.deliveryZoneName})` : ""}</dt><dd>{order.deliveryCharge === 0 ? "Free" : formatPrice(order.deliveryCharge)}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-green"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="border border-line bg-cream p-5 sm:p-6">
          <h2 className="text-xl text-green">Delivery address</h2>
          <p className="mt-2 text-sm">{order.customerName}</p>
          <p className="text-sm text-muted">{order.phone}</p>
          <p className="mt-2 text-sm">{order.shippingAddress}</p>
          <p className="text-sm text-muted">{[order.shippingArea, order.shippingCity, order.shippingDistrict, order.shippingPostalCode].filter(Boolean).join(", ")}</p>
        </section>
        <section className="border border-line bg-cream p-5 sm:p-6">
          <h2 className="text-xl text-green">Payment</h2>
          <p className="mt-2 text-sm">{PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}</p>
          <p className="mt-2 text-sm text-muted">Payment status: <StatusBadge status={order.paymentStatus} /></p>
          {order.notes && (<><h3 className="mt-4 font-sans text-sm font-semibold">Your note</h3><p className="text-sm text-muted">{order.notes}</p></>)}
        </section>
      </div>
      <p className="mt-6 text-sm text-muted">Need help with this order? <Link href="/contact" className="underline">Contact us</Link> and quote {order.orderNumber}.</p>
    </div>
  );
}
