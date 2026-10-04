import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { formatPrice } from "@/lib/format";
import { formatDate } from "@/lib/order-display";
import { toggleCoupon, deleteCoupon } from "@/app/actions/admin-coupons";
import { PageHeader, Flash, TableWrap, th, td } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const metadata: Metadata = { title: "Coupons" };
export const dynamic = "force-dynamic";

export default async function AdminCoupons({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  const now = new Date();
  return (
    <div>
      <PageHeader title="Coupons" subtitle="Coupons are checked on the server at checkout." action={<Link href="/admin/coupons/new" className="btn btn-primary">New coupon</Link>} />
      <Flash ok={sp.ok} error={sp.error} />
      {rows.length === 0 ? <p className="border border-line bg-cream p-10 text-center text-muted">No coupons yet.</p> : (
        <TableWrap>
          <thead><tr><th className={th}>Code</th><th className={th}>Discount</th><th className={th}>Rules</th><th className={th}>Used</th><th className={th}>Status</th><th className={th}>Actions</th></tr></thead>
          <tbody>
            {rows.map((c) => {
              const expired = !!c.expiresAt && c.expiresAt < now;
              const notYet = !!c.startsAt && c.startsAt > now;
              const status = !c.isActive ? ["Inactive", "bg-muted/15 text-muted"] : expired ? ["Expired", "bg-danger/10 text-danger"] : notYet ? ["Scheduled", "bg-gold/20 text-gold-dark"] : ["Live", "bg-success/15 text-success"];
              return (
                <tr key={c.id}>
                  <td className={td}><Link href={`/admin/coupons/${c.id}`} className="font-semibold text-green underline">{c.code}</Link>{c.description && <span className="block text-xs text-muted">{c.description}</span>}</td>
                  <td className={td}>{c.discountType === "percent" ? `${c.discountValue}%` : formatPrice(c.discountValue)}{c.maxDiscountAmount ? <span className="block text-xs text-muted">max {formatPrice(c.maxDiscountAmount)}</span> : null}</td>
                  <td className={`${td} text-xs text-muted`}>
                    {c.minOrderAmount > 0 && <span className="block">Min order {formatPrice(c.minOrderAmount)}</span>}
                    {c.expiresAt && <span className="block">Expires {formatDate(c.expiresAt, true)}</span>}
                    {c.perCustomerLimit && <span className="block">{c.perCustomerLimit} per customer</span>}
                  </td>
                  <td className={td}>{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                  <td className={td}><span className={`px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${status[1]}`}>{status[0]}</span></td>
                  <td className={td}>
                    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider">
                      <form action={toggleCoupon}><input type="hidden" name="id" value={c.id} /><button type="submit" className="text-green underline">{c.isActive ? "Deactivate" : "Activate"}</button></form>
                      <form action={deleteCoupon}><input type="hidden" name="id" value={c.id} /><ConfirmButton message={`Delete coupon ${c.code}?`} className="text-danger underline">Delete</ConfirmButton></form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}
