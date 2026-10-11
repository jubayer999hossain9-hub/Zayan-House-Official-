import type { Metadata } from "next";
import Link from "next/link";
import { count, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, customers } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { formatDate } from "@/lib/order-display";
import { Banknote, CalendarDays, ShoppingBag, Clock, Truck, CheckCircle2, XCircle, Users, AlertTriangle } from "lucide-react";
import { Card, PageHeader, TableWrap, th, td } from "@/components/admin/ui";
import { StatusBadge } from "@/components/status-badge";

const CARD_TONES = {
  green: { bar: "border-t-emerald-500", chip: "bg-emerald-100 text-emerald-700" },
  gold: { bar: "border-t-amber-400", chip: "bg-amber-100 text-amber-700" },
  blue: { bar: "border-t-blue-500", chip: "bg-blue-100 text-blue-700" },
  amber: { bar: "border-t-orange-400", chip: "bg-orange-100 text-orange-700" },
  violet: { bar: "border-t-violet-500", chip: "bg-violet-100 text-violet-700" },
  teal: { bar: "border-t-teal-500", chip: "bg-teal-100 text-teal-700" },
  red: { bar: "border-t-rose-500", chip: "bg-rose-100 text-rose-700" },
  pink: { bar: "border-t-pink-500", chip: "bg-pink-100 text-pink-700" },
} as const;

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const settings = await getSettings();
  const low = settings.inventory.lowStockThreshold;

  const [[o], [c], lowRes, recent, daily] = await Promise.all([
    db.select({
      total: count(),
      pending: sql<number>`count(*) filter (where ${orders.status} = 'pending')::int`.mapWith(Number),
      processing: sql<number>`count(*) filter (where ${orders.status} in ('confirmed','processing','shipped'))::int`.mapWith(Number),
      delivered: sql<number>`count(*) filter (where ${orders.status} = 'delivered')::int`.mapWith(Number),
      cancelled: sql<number>`count(*) filter (where ${orders.status} = 'cancelled')::int`.mapWith(Number),
      sales: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} <> 'cancelled'), 0)::int`.mapWith(Number),
      today: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} <> 'cancelled' and (${orders.createdAt} at time zone 'Asia/Dhaka')::date = (now() at time zone 'Asia/Dhaka')::date), 0)::int`.mapWith(Number),
    }).from(orders),
    db.select({ total: count() }).from(customers),
    db.execute<{ n: number }>(sql`
      select count(*)::int as n from (
        select v.stock from product_variants v join products p on p.id = v.product_id where p.status = 'active' and v.status = 'active'
        union all select p.stock from products p where p.status = 'active' and not exists (select 1 from product_variants v where v.product_id = p.id)
      ) s where s.stock <= ${low}`),
    db.select({ id: orders.id, orderNumber: orders.orderNumber, name: orders.customerName, status: orders.status, total: orders.total, createdAt: orders.createdAt }).from(orders).orderBy(desc(orders.createdAt)).limit(6),
    db.execute<{ day: string; sales: number }>(sql`
      select to_char(d, 'YYYY-MM-DD') as day, coalesce(sum(o.total) filter (where o.status <> 'cancelled'), 0)::int as sales
      from generate_series((now() at time zone 'Asia/Dhaka')::date - 13, (now() at time zone 'Asia/Dhaka')::date, interval '1 day') d
      left join orders o on (o.created_at at time zone 'Asia/Dhaka')::date = d::date
      group by d order by d`),
  ]);
  const lowCount = Number((lowRes.rows[0] as { n: number }).n);
  const series = daily.rows as { day: string; sales: number }[];
  const max = Math.max(1, ...series.map((s) => s.sales));
  const week = series.slice(-7).reduce((s, d) => s + d.sales, 0);

  const cards: { label: string; value: string; href: string; note?: string; alert?: boolean; tone: keyof typeof CARD_TONES; Icon: typeof Banknote }[] = [
    { label: "Total sales", value: formatPrice(o.sales), href: "/admin/orders", note: "Cancelled orders not counted", tone: "green", Icon: Banknote },
    { label: "Sales today", value: formatPrice(o.today), href: "/admin/orders", tone: "gold", Icon: CalendarDays },
    { label: "Total orders", value: String(o.total), href: "/admin/orders", tone: "blue", Icon: ShoppingBag },
    { label: "Pending orders", value: String(o.pending), href: "/admin/orders?status=pending", alert: o.pending > 0, tone: "amber", Icon: Clock },
    { label: "In progress", value: String(o.processing), href: "/admin/orders?status=processing", note: "Confirmed, processing, shipped", tone: "violet", Icon: Truck },
    { label: "Delivered", value: String(o.delivered), href: "/admin/orders?status=delivered", tone: "teal", Icon: CheckCircle2 },
    { label: "Cancelled", value: String(o.cancelled), href: "/admin/orders?status=cancelled", tone: "red", Icon: XCircle },
    { label: "Customers", value: String(c.total), href: "/admin/customers", tone: "pink", Icon: Users },
    { label: "Low / out of stock", value: String(lowCount), href: "/admin/inventory?filter=low", alert: lowCount > 0, note: `${low} or fewer in stock`, tone: "amber", Icon: AlertTriangle },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Live numbers from your database." />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((k) => {
          const t = CARD_TONES[k.tone];
          return (
            <Link key={k.label} href={k.href} className={`group border border-line border-t-4 bg-cream p-5 transition hover:-translate-y-0.5 hover:shadow-soft ${t.bar}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">{k.label}</p>
                  <p className="mt-2 font-serif text-3xl text-green">{k.value}</p>
                  {k.note && <p className="mt-1 text-xs text-muted">{k.note}</p>}
                </div>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${t.chip}`}><k.Icon size={22} strokeWidth={1.75} aria-hidden /></span>
              </div>
              {k.alert && <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-wider text-amber-800 ring-1 ring-inset ring-amber-300/60 before:h-1.5 before:w-1.5 before:animate-pulse before:rounded-full before:bg-current">Needs attention</span>}
            </Link>
          );
        })}
      </div>

      <Card title="Sales, last 14 days" className="mt-6">
        <p className="mb-4 text-sm text-muted">Last 7 days: <strong className="text-green">{formatPrice(week)}</strong></p>
        <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Daily sales for the last 14 days">
          {series.map((d, idx) => (
            <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
              <div className={`w-full rounded-t-md transition-colors group-hover:bg-gold ${idx === series.length - 1 ? "bg-gold" : "bg-green"}`} style={{ height: `${Math.max(d.sales > 0 ? 4 : 1, (d.sales / max) * 100)}%`, opacity: d.sales > 0 ? 1 : 0.25 }} />
              <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap bg-charcoal px-2 py-1 text-[0.65rem] text-cream group-hover:block">{d.day.slice(5)}: {formatPrice(d.sales)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[0.65rem] text-muted"><span>{series[0]?.day.slice(5)}</span><span>{series[series.length - 1]?.day.slice(5)}</span></div>
      </Card>

      <div className="mt-6">
        <div className="mb-3 flex items-end justify-between"><h2 className="text-xl text-green">Recent orders</h2><Link href="/admin/orders" className="text-xs font-semibold uppercase tracking-wider text-green underline">View all</Link></div>
        {recent.length === 0 ? <p className="border border-line bg-cream p-8 text-center text-sm text-muted">No orders yet. They will appear here as soon as customers check out.</p> : (
          <TableWrap>
            <thead><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Date</th><th className={th}>Status</th><th className={th}>Total</th></tr></thead>
            <tbody>{recent.map((r) => (
              <tr key={r.id} className="hover:bg-ivory">
                <td className={td}><Link href={`/admin/orders/${r.id}`} className="font-semibold text-green underline">{r.orderNumber}</Link></td>
                <td className={td}>{r.name}</td><td className={td}>{formatDate(r.createdAt, true)}</td>
                <td className={td}><StatusBadge status={r.status} /></td><td className={td}>{formatPrice(r.total)}</td>
              </tr>
            ))}</tbody>
          </TableWrap>
        )}
      </div>
    </div>
  );
}
