import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, customerAddresses, orders } from "@/db/schema";
import { formatPrice } from "@/lib/format";
import { formatDate } from "@/lib/order-display";
import { PageHeader, Card, TableWrap, th, td } from "@/components/admin/ui";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = { title: "Customer" };
export const dynamic = "force-dynamic";

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idRaw } = await params;
  if (!/^\d+$/.test(idRaw)) notFound();
  const id = Number(idRaw);
  const [c] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!c) notFound();
  const [addresses, orderRows] = await Promise.all([
    db.select().from(customerAddresses).where(eq(customerAddresses.customerId, id)),
    db.select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, total: orders.total, createdAt: orders.createdAt }).from(orders).where(eq(orders.customerId, id)).orderBy(desc(orders.createdAt)),
  ]);
  const spent = orderRows.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="text-xs font-semibold uppercase tracking-[0.16em] text-green underline">← All customers</Link>
      <PageHeader title={c.name} subtitle={c.userId ? "Registered customer" : "Guest customer (ordered without an account)"} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Contact"><p className="text-sm">{c.phone}</p>{c.email && <p className="text-sm text-muted">{c.email}</p>}<p className="mt-2 text-xs text-muted">Customer since {formatDate(c.createdAt)}</p></Card>
        <Card title="Orders"><p className="font-serif text-3xl text-green">{orderRows.length}</p></Card>
        <Card title="Total spent"><p className="font-serif text-3xl text-green">{formatPrice(spent)}</p><p className="text-xs text-muted">Cancelled orders not counted</p></Card>
      </div>
      <Card title="Saved addresses">
        {addresses.length === 0 ? <p className="text-sm text-muted">No saved addresses.</p> : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {addresses.map((a) => (
              <li key={a.id} className="border border-line bg-ivory p-3 text-sm">
                <p className="font-semibold">{a.label}{a.isDefault ? " (default)" : ""}</p>
                <p>{a.fullName} · {a.phone}</p>
                <p className="text-muted">{a.address}, {[a.area, a.city, a.district, a.postalCode].filter(Boolean).join(", ")}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <div>
        <h2 className="mb-3 text-xl text-green">Order history</h2>
        {orderRows.length === 0 ? <p className="border border-line bg-cream p-6 text-sm text-muted">No orders yet.</p> : (
          <TableWrap>
            <thead><tr><th className={th}>Order</th><th className={th}>Date</th><th className={th}>Status</th><th className={th}>Total</th></tr></thead>
            <tbody>{orderRows.map((o) => (
              <tr key={o.id}><td className={td}><Link href={`/admin/orders/${o.id}`} className="font-semibold text-green underline">{o.orderNumber}</Link></td><td className={td}>{formatDate(o.createdAt)}</td><td className={td}><StatusBadge status={o.status} /></td><td className={td}>{formatPrice(o.total)}</td></tr>
            ))}</tbody>
          </TableWrap>
        )}
      </div>
    </div>
  );
}
