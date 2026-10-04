import type { Metadata } from "next";
import Link from "next/link";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, customerAddresses } from "@/db/schema";
import { requireCustomer } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { formatDate } from "@/lib/order-display";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = { title: "My Account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const customer = await requireCustomer();
  const [[stats], recent, addressCount] = await Promise.all([
    db
      .select({
        total: count(),
        spent: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} <> 'cancelled'), 0)`.mapWith(Number),
      })
      .from(orders)
      .where(eq(orders.userId, customer.id)),
    db
      .select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, total: orders.total, createdAt: orders.createdAt })
      .from(orders)
      .where(eq(orders.userId, customer.id))
      .orderBy(desc(orders.createdAt))
      .limit(3),
    customer.customerId
      ? db.select({ n: count() }).from(customerAddresses).where(eq(customerAddresses.customerId, customer.customerId))
      : Promise.resolve([{ n: 0 }]),
  ]);

  return (
    <div>
      <h1 className="text-4xl text-green">Hello, {customer.name.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-muted">Manage your orders, addresses and profile.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="border border-line bg-cream p-5"><p className="text-xs uppercase tracking-[0.14em] text-muted">Orders</p><p className="mt-2 font-serif text-3xl text-green">{stats.total}</p></div>
        <div className="border border-line bg-cream p-5"><p className="text-xs uppercase tracking-[0.14em] text-muted">Total spent</p><p className="mt-2 font-serif text-3xl text-green">{formatPrice(stats.spent)}</p></div>
        <Link href="/account/addresses" className="border border-line bg-cream p-5 hover:shadow-soft"><p className="text-xs uppercase tracking-[0.14em] text-muted">Saved addresses</p><p className="mt-2 font-serif text-3xl text-green">{addressCount[0].n}</p></Link>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl text-green">Recent orders</h2>
          {recent.length > 0 && <Link href="/account/orders" className="text-xs font-semibold uppercase tracking-[0.16em] text-green underline">View all</Link>}
        </div>
        {recent.length === 0 ? (
          <div className="border border-line bg-cream p-8 text-center">
            <p className="text-muted">You have not placed any orders yet.</p>
            <Link href="/shop" className="btn btn-primary mt-5">Start Shopping</Link>
          </div>
        ) : (
          <ul className="divide-y divide-line border border-line bg-cream">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.orderNumber}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-ivory">
                  <div>
                    <p className="font-semibold text-green">{o.orderNumber}</p>
                    <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                  </div>
                  <StatusBadge status={o.status} />
                  <p className="font-semibold">{formatPrice(o.total)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
