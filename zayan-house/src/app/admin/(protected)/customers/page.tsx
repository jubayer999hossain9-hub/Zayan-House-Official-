import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { formatPrice } from "@/lib/format";
import { formatDate } from "@/lib/order-display";
import { PageHeader, TableWrap, th, td, Pager, qs, pageParam } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const q = sp.q?.trim().slice(0, 100);
  const conds: (SQL | undefined)[] = [];
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    conds.push(or(ilike(customers.name, like), ilike(customers.phone, like), ilike(customers.email, like)));
  }
  const where = conds.length ? and(...conds) : undefined;

  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(customers).where(where),
    db.select({
      id: customers.id, name: customers.name, phone: customers.phone, email: customers.email, registered: sql<boolean>`${customers.userId} is not null`, createdAt: customers.createdAt,
      orderCount: sql<number>`count(${orders.id})::int`.mapWith(Number),
      spent: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} <> 'cancelled'), 0)::int`.mapWith(Number),
    })
      .from(customers).leftJoin(orders, eq(orders.customerId, customers.id)).where(where).groupBy(customers.id)
      .orderBy(desc(customers.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
  ]);

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${total} customer${total === 1 ? "" : "s"}. Guests who ordered without an account are included.`} />
      <form method="get" className="mb-5 flex gap-3">
        <input name="q" defaultValue={q ?? ""} placeholder="Search name, phone or email" aria-label="Search customers" className="field max-w-md" />
        <button className="btn btn-primary" type="submit">Search</button>
      </form>
      {rows.length === 0 ? <p className="border border-line bg-cream p-10 text-center text-muted">No customers found.</p> : (
        <TableWrap>
          <thead><tr><th className={th}>Customer</th><th className={th}>Contact</th><th className={th}>Account</th><th className={th}>Orders</th><th className={th}>Total spent</th><th className={th}>Since</th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-ivory">
                <td className={td}><Link href={`/admin/customers/${c.id}`} className="font-semibold text-green underline">{c.name}</Link></td>
                <td className={td}>{c.phone}{c.email && <span className="block text-xs text-muted">{c.email}</span>}</td>
                <td className={td}>{c.registered ? "Registered" : "Guest"}</td>
                <td className={td}>{c.orderCount}</td>
                <td className={td}>{formatPrice(c.spent)}</td>
                <td className={td}>{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      <Pager page={page} totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))} hrefFor={(p) => `/admin/customers${qs({ q, page: p > 1 ? p : undefined })}`} />
    </div>
  );
}
