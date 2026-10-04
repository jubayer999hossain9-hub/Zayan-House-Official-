import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { formatPrice } from "@/lib/format";
import { formatDate } from "@/lib/order-display";
import { PageHeader, Flash, TableWrap, th, td, Pager, qs, pageParam } from "@/components/admin/ui";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;
const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
const PAYMENTS = ["pending", "paid", "failed", "refunded"] as const;

type SP = { q?: string; status?: string; payment?: string; page?: string; ok?: string; error?: string };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const q = sp.q?.trim().slice(0, 100);
  const status = STATUSES.find((s) => s === sp.status);
  const payment = PAYMENTS.find((s) => s === sp.payment);
  const conds: (SQL | undefined)[] = [];
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    conds.push(or(ilike(orders.orderNumber, like), ilike(orders.customerName, like), ilike(orders.phone, like), ilike(orders.email, like)));
  }
  if (status) conds.push(eq(orders.status, status));
  if (payment) conds.push(eq(orders.paymentStatus, payment));
  const where = conds.length ? and(...conds) : undefined;

  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(orders).where(where),
    db.select({
      id: orders.id, orderNumber: orders.orderNumber, name: orders.customerName, phone: orders.phone, status: orders.status,
      paymentStatus: orders.paymentStatus, total: orders.total, createdAt: orders.createdAt, district: orders.shippingDistrict,
    }).from(orders).where(where).orderBy(desc(orders.createdAt), desc(orders.id)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
  ]);

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${total} order${total === 1 ? "" : "s"}`} />
      <Flash ok={sp.ok} error={sp.error} />
      <form method="get" className="mb-5 grid gap-3 sm:grid-cols-[1fr_160px_160px_auto]">
        <input name="q" defaultValue={q ?? ""} placeholder="Search order number, name, phone, email" aria-label="Search orders" className="field" />
        <select name="status" defaultValue={status ?? ""} aria-label="Order status" className="field"><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select>
        <select name="payment" defaultValue={payment ?? ""} aria-label="Payment status" className="field"><option value="">All payments</option>{PAYMENTS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select>
        <button className="btn btn-primary" type="submit">Filter</button>
      </form>
      {rows.length === 0 ? (
        <p className="border border-line bg-cream p-10 text-center text-muted">No orders found.</p>
      ) : (
        <TableWrap>
          <thead><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Date</th><th className={th}>Total</th><th className={th}>Status</th><th className={th}>Payment</th></tr></thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-ivory">
                <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-semibold text-green underline">{o.orderNumber}</Link></td>
                <td className={td}>{o.name}<span className="block text-xs text-muted">{o.phone} · {o.district}</span></td>
                <td className={td}>{formatDate(o.createdAt, true)}</td>
                <td className={td}>{formatPrice(o.total)}</td>
                <td className={td}><StatusBadge status={o.status} /></td>
                <td className={td}><StatusBadge status={o.paymentStatus} /></td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      <Pager page={page} totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))} hrefFor={(p) => `/admin/orders${qs({ q, status, payment, page: p > 1 ? p : undefined })}`} />
    </div>
  );
}
