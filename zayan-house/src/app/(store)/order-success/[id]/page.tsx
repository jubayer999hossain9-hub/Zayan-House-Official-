import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CheckCircle2 } from "lucide-react";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { getCurrentCustomer } from "@/lib/auth";
import { hasOrderAccess } from "@/lib/order-access";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "@/components/product-image";

export const metadata: Metadata = { title: "Order Confirmed", robots: { index: false } };
export const dynamic = "force-dynamic";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, id.toUpperCase())).limit(1);
  if (!order) notFound();

  const customer = await getCurrentCustomer();
  const owner = !!customer && order.userId === customer.id;
  if (!owner && !(await hasOrderAccess(order.id))) notFound();

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(orderItems.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="text-center">
        <CheckCircle2 size={56} strokeWidth={1.3} className="mx-auto text-success" />
        <h1 className="mt-4 text-4xl text-green sm:text-5xl">Order confirmed</h1>
        <p className="mt-2 text-muted">Thank you, {order.customerName.split(" ")[0]}. We have received your order and will contact you shortly.</p>
        <p className="mt-4 inline-block border border-gold bg-cream px-5 py-2 text-sm">
          Order number: <strong data-testid="order-number" className="tracking-wider text-green">{order.orderNumber}</strong>
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <section className="border border-line bg-cream p-5">
          <h2 className="text-xl text-green">Customer</h2>
          <p className="mt-2 text-sm">{order.customerName}</p>
          <p className="text-sm text-muted">{order.phone}</p>
          {order.email && <p className="text-sm text-muted">{order.email}</p>}
        </section>
        <section className="border border-line bg-cream p-5">
          <h2 className="text-xl text-green">Delivery address</h2>
          <p className="mt-2 text-sm">{order.shippingAddress}</p>
          <p className="text-sm text-muted">{[order.shippingArea, order.shippingCity, order.shippingDistrict, order.shippingPostalCode].filter(Boolean).join(", ")}</p>
        </section>
      </div>

      <section className="mt-4 border border-line bg-cream p-5">
        <h2 className="text-xl text-green">Your items</h2>
        <ul className="mt-3 divide-y divide-line">
          {items.map((i) => (
            <li key={i.id} className="flex gap-3 py-3">
              <ProductImage url={i.imageUrl} alt={i.productName} className="h-20 w-16 shrink-0 border border-line" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">{i.productName}</p>
                <p className="text-xs text-muted">{[i.size && `Size ${i.size}`, i.color].filter(Boolean).join(" · ")} · Qty {i.quantity} × {formatPrice(i.unitPrice)}</p>
              </div>
              <p className="text-sm font-semibold">{formatPrice(i.lineTotal)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-success"><dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd>-{formatPrice(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">Delivery{order.deliveryZoneName ? ` (${order.deliveryZoneName})` : ""}</dt><dd>{order.deliveryCharge === 0 ? "Free" : formatPrice(order.deliveryCharge)}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-green"><dt>Grand total</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1 border-t border-line pt-4 text-sm">
          <p><span className="text-muted">Payment: </span>{order.paymentMethod === "cod" ? "Cash on Delivery" : cap(order.paymentMethod)} ({cap(order.paymentStatus)})</p>
          <p><span className="text-muted">Order status: </span>{cap(order.status)}</p>
        </div>
      </section>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {owner ? (
          <Link href={`/account/orders/${order.orderNumber}`} className="btn btn-primary">View Order</Link>
        ) : (
          <Link href="/register?next=/account" className="btn btn-primary">Create account to track orders</Link>
        )}
        <Link href="/shop" className="btn btn-outline">Continue Shopping</Link>
      </div>
    </div>
  );
}
