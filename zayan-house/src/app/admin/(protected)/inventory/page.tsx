import type { Metadata } from "next";
import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getSettings } from "@/lib/settings";
import { setStock } from "@/app/actions/admin-inventory";
import { PageHeader, Flash, TableWrap, th, td, Pager, qs, pageParam } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Inventory" };
export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

type Row = { kind: "variant" | "product"; id: number; product_id: number; product: string; variant: string | null; sku: string; stock: number; active: boolean };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; page?: string; ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const settings = await getSettings();
  const low = settings.inventory.lowStockThreshold;
  const page = pageParam(sp.page);
  const q = sp.q?.trim().slice(0, 100) ?? "";
  const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
  const filter = sp.filter === "low" || sp.filter === "out" ? sp.filter : "";

  // One list of "stock lines": every variant, plus every product that has no variants.
  const base = sql`
    select * from (
      select 'variant'::text as kind, v.id, p.id as product_id, p.name as product,
             concat_ws(' / ', v.size, v.color) as variant, v.sku, v.stock, (v.status = 'active' and p.status = 'active') as active
        from product_variants v join products p on p.id = v.product_id
      union all
      select 'product'::text, p.id, p.id, p.name, null, p.sku, p.stock, (p.status = 'active')
        from products p where not exists (select 1 from product_variants v where v.product_id = p.id)
    ) s
    where (${q} = '' or s.product ilike ${like} or s.sku ilike ${like} or coalesce(s.variant,'') ilike ${like})
      and (${filter} = '' or (${filter} = 'out' and s.stock <= 0) or (${filter} = 'low' and s.stock > 0 and s.stock <= ${low}))`;

  const [list, countRes] = await Promise.all([
    db.execute<Row>(sql`${base} order by s.stock asc, s.product asc, s.variant asc limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`),
    db.execute<{ n: number }>(sql`select count(*)::int as n from (${base}) c`),
  ]);
  const rows = list.rows as Row[];
  const total = Number((countRes.rows[0] as { n: number }).n);
  const here = `/admin/inventory${qs({ q, filter, page: page > 1 ? page : undefined })}`;

  return (
    <div>
      <PageHeader title="Inventory" subtitle={`Low stock means ${low} or fewer. You can change this in Settings.`} />
      <Flash ok={sp.ok} error={sp.error} />
      <form method="get" className="mb-5 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
        <input name="q" defaultValue={q} placeholder="Search product, variant or SKU" aria-label="Search inventory" className="field" />
        <select name="filter" defaultValue={filter} aria-label="Stock filter" className="field"><option value="">All stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
        <button className="btn btn-primary" type="submit">Filter</button>
      </form>
      {rows.length === 0 ? <p className="border border-line bg-cream p-10 text-center text-muted">Nothing found.</p> : (
        <TableWrap>
          <thead><tr><th className={th}>Product</th><th className={th}>Variant</th><th className={th}>SKU</th><th className={th}>Level</th><th className={th}>Stock</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const level = r.stock <= 0 ? ["Out of stock", "bg-danger/10 text-danger"] : r.stock <= low ? ["Low", "bg-gold/20 text-gold-dark"] : ["OK", "bg-success/15 text-success"];
              return (
                <tr key={`${r.kind}-${r.id}`} className="hover:bg-ivory">
                  <td className={td}><Link href={`/admin/products/${r.product_id}`} className="font-medium text-green underline">{r.product}</Link>{!r.active && <span className="ml-2 text-xs text-muted">(hidden)</span>}</td>
                  <td className={td}>{r.variant || "-"}</td>
                  <td className={td}>{r.sku}</td>
                  <td className={td}><span className={`px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${level[1]}`}>{level[0]}</span></td>
                  <td className={td}>
                    <form action={setStock} className="flex items-center gap-2">
                      <input type="hidden" name="kind" value={r.kind} /><input type="hidden" name="id" value={r.id} /><input type="hidden" name="back" value={here} />
                      <input name="stock" defaultValue={r.stock} inputMode="numeric" aria-label={`Stock for ${r.sku}`} className="field !w-20 !px-2 !py-1.5" />
                      <button type="submit" className="btn btn-outline !px-3 !py-1.5 !text-[0.65rem]">Save</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}
      <Pager page={page} totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))} hrefFor={(p) => `/admin/inventory${qs({ q, filter, page: p > 1 ? p : undefined })}`} />
    </div>
  );
}
