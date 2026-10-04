import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { formatPrice } from "@/lib/format";
import { formatDate, PAYMENT_METHOD_LABEL } from "@/lib/order-display";
import { updateOrder } from "@/app/actions/admin-orders";
import { PageHeader, Flash, Card } from "@/components/admin/ui";
import { StatusBadge } from "@/components/status-badge";
import { ProductImage } from "@/components/product-image";

export const metadata: Metadata = { title: "Order" };
export const dynamic = "force-dynamic";

export default async function AdminOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id: idRaw } = await params;
  if (!/^\d+$/.test(idRaw)) notFound();
  const sp = await searchParams;
  const [order] = await db.select().from(orders).where(eq(orders.id, Number(idRaw))).limit(1);
  if (!order) notFound();
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(orderItems.id);
  const cancelled = order.status === "cancelled";
  const statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
  const payments = ["pending", "paid", "failed", "refunded"] as const;

  return (
    <div>
      <Link href="/admin/orders" className="text-xs font-semibold uppercase tracking-[0.16em] text-green underline">← All orders</Link>
      <PageHeader title={`Order ${order.orderNumber}`} subtitle={`Placed ${formatDate(order.createdAt, true)} · ${order.deliveryZoneName ?? ""}`} action={<StatusBadge status={order.status} />} />
      <Flash ok={sp.ok} error={sp.error} />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card title="Items">
            <ul className="divide-y divide-line">
              {items.map((i) => (
                <li key={i.id} className="flex gap-3 py-3">
                  <ProductImage url={i.imageUrl} alt={i.productName} className="h-20 w-16 shrink-0 border border-line" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium">{i.productName}</p>
                    <p className="text-xs text-muted">{[i.size && `Size ${i.size}`, i.color].filter(Boolean).join(" · ")} · SKU {i.sku}</p>
                    <p className="text-xs text-muted">{i.quantity} × {formatPrice(i.unitPrice)}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatPrice(i.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between text-success"><dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd>-{formatPrice(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{order.deliveryCharge === 0 ? "Free" : formatPrice(order.deliveryCharge)}</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-green"><dt>Grand total</dt><dd>{formatPrice(order.total)}</dd></div>
            </dl>
          </Card>
          <div className="grid gap-6 sm:grid-cols-2">
            <Card title="Customer">
              <p className="text-sm font-medium">{order.customerName}</p>
              <p className="text-sm text-muted"><a href={`tel:${order.phone}`} className="underline">{order.phone}</a></p>
              {order.email && <p className="text-sm text-muted">{order.email}</p>}
              {order.customerId && <Link href={`/admin/customers/${order.customerId}`} className="mt-2 inline-block text-xs font-semibold uppercase tracking-wider text-green underline">View customer</Link>}
            </Card>
            <Card title="Delivery address">
              <p className="text-sm">{order.shippingAddress}</p>
              <p className="text-sm text-muted">{[order.shippingArea, order.shippingCity, order.shippingDistrict, order.shippingPostalCode].filter(Boolean).join(", ")}</p>
              {order.notes && <><h3 className="mt-3 font-sans text-sm font-semibold">Customer note</h3><p className="text-sm text-muted">{order.notes}</p></>}
            </Card>
          </div>
        </div>

        <form action={updateOrder} className="h-fit space-y-4 border border-line bg-cream p-5">
          <h2 className="text-xl text-green">Manage order</h2>
          <input type="hidden" name="id" value={order.id} />
          <div>
            <label htmlFor="o-status" className="label">Order status</label>
            <select id="o-status" name="status" defaultValue={order.status} disabled={cancelled} className="field">
              {statuses.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
            {cancelled && <><input type="hidden" name="status" value="cancelled" /><p className="mt-1 text-xs text-muted">Cancelled orders cannot be reopened.</p></>}
          </div>
          <div>
            <label htmlFor="o-pay" className="label">Payment status ({PAYMENT_METHOD_LABEL[order.paymentMethod]})</label>
            <select id="o-pay" name="paymentStatus" defaultValue={order.paymentStatus} className="field">
              {payments.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="o-notes" className="label">Admin notes (private)</label>
            <textarea id="o-notes" name="adminNotes" defaultValue={order.adminNotes ?? ""} rows={4} maxLength={2000} className="field" />
          </div>
          <button type="submit" className="btn btn-primary w-full">Save changes</button>
          <p className="text-xs text-muted">Cancelling returns the items to stock and frees the coupon use. Marking a Cash on Delivery order as Delivered also marks it Paid, unless you set the payment yourself.</p>
        </form>
      </div>
    </div>
  );
}
