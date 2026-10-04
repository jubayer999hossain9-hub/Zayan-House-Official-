import type { Metadata } from "next";
import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireCustomer } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { formatDate } from "@/lib/order-display";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = { title: "My Orders", robots: { index: false } };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const customer = await requireCustomer();
  const { page: pageRaw } = await searchParams;
  const page = /^\d{1,4}$/.test(pageRaw ?? "") ? Math.max(1, Number(pageRaw)) : 1;

  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(orders).where(eq(orders.userId, customer.id)),
    db
      .select({
        id: orders.id, orderNumber: orders.orderNumber, status: orders.status, paymentStatus: orders.paymentStatus,
        total: orders.total, createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, customer.id))
      .orderBy(desc(orders.createdAt), desc(orders.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-4xl text-green">My Orders</h1>
      {rows.length === 0 ? (
        <div className="mt-8 border border-line bg-cream p-10 text-center">
          <h2 className="text-2xl text-green">No orders yet</h2>
          <p className="mt-2 text-muted">When you place an order, it will appear here.</p>
          <Link href="/shop" className="btn btn-primary mt-6">Start Shopping</Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 divide-y divide-line border border-line bg-cream">
            {rows.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.orderNumber}`} className="grid items-center gap-2 px-5 py-4 hover:bg-ivory sm:grid-cols-[1.4fr_1fr_1fr_auto]">
                  <div>
                    <p className="font-semibold text-green">{o.orderNumber}</p>
                    <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                  </div>
                  <div><StatusBadge status={o.status} /></div>
                  <div className="text-xs text-muted">Payment: <StatusBadge status={o.paymentStatus} /></div>
                  <p className="font-semibold sm:text-right">{formatPrice(o.total)}</p>
                </Link>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
              {page > 1 && <Link href={`/account/orders?page=${page - 1}`} className="btn btn-outline !px-4">Previous</Link>}
              <span className="text-sm text-muted">Page {page} of {totalPages}</span>
              {page < totalPages && <Link href={`/account/orders?page=${page + 1}`} className="btn btn-outline !px-4">Next</Link>}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
