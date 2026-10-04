import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { products, productImages, productVariants, categories } from "@/db/schema";
import { formatPrice } from "@/lib/format";
import { PageHeader, Flash, TableWrap, th, td, Pager, qs, pageParam } from "@/components/admin/ui";
import { ProductImage } from "@/components/product-image";

export const metadata: Metadata = { title: "Products" };
export const dynamic = "force-dynamic";
const PAGE_SIZE = 15;

type SP = { q?: string; status?: string; category?: string; page?: string; ok?: string; error?: string };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const q = sp.q?.trim().slice(0, 100);
  const conds: (SQL | undefined)[] = [];
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    conds.push(or(ilike(products.name, like), ilike(products.sku, like), sql`exists (select 1 from ${productVariants} where ${productVariants.productId} = ${products.id} and ${productVariants.sku} ilike ${like})`));
  }
  if (sp.status === "draft" || sp.status === "active" || sp.status === "archived") conds.push(eq(products.status, sp.status));
  if (sp.category && /^\d+$/.test(sp.category)) conds.push(eq(products.categoryId, Number(sp.category)));
  const where = conds.length ? and(...conds) : undefined;

  const [cats, [{ total }], rows] = await Promise.all([
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.displayOrder),
    db.select({ total: count() }).from(products).leftJoin(categories, eq(categories.id, products.categoryId)).where(where),
    db
      .select({
        id: products.id, name: products.name, sku: products.sku, status: products.status, regularPrice: products.regularPrice, salePrice: products.salePrice,
        stock: products.stock, isFeatured: products.isFeatured, isBestseller: products.isBestseller, isNew: products.isNewArrival,
        category: categories.name,
        image: sql<string | null>`(select ${productImages.url} from ${productImages} where ${productImages.productId} = ${products.id} order by ${productImages.position}, ${productImages.id} limit 1)`,
        variantCount: sql<number>`(select count(*)::int from ${productVariants} where ${productVariants.productId} = ${products.id})`.mapWith(Number),
        variantStock: sql<number>`(select coalesce(sum(${productVariants.stock}),0)::int from ${productVariants} where ${productVariants.productId} = ${products.id})`.mapWith(Number),
      })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(where)
      .orderBy(desc(products.createdAt), desc(products.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const statusColor: Record<string, string> = { active: "bg-success/15 text-success", draft: "bg-gold/20 text-gold-dark", archived: "bg-muted/15 text-muted" };

  return (
    <div>
      <PageHeader title="Products" subtitle={`${total} product${total === 1 ? "" : "s"}`} action={<Link href="/admin/products/new" className="btn btn-primary">Add product</Link>} />
      <Flash ok={sp.ok} error={sp.error} />
      <form method="get" className="mb-5 grid gap-3 sm:grid-cols-[1fr_160px_180px_auto]">
        <input name="q" defaultValue={q ?? ""} placeholder="Search name or SKU" aria-label="Search products" className="field" />
        <select name="status" defaultValue={sp.status ?? ""} aria-label="Status" className="field"><option value="">All statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
        <select name="category" defaultValue={sp.category ?? ""} aria-label="Category" className="field"><option value="">All categories</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <button className="btn btn-primary" type="submit">Filter</button>
      </form>
      {rows.length === 0 ? (
        <p className="border border-line bg-cream p-10 text-center text-muted">No products found. <Link href="/admin/products/new" className="underline">Add your first product</Link>.</p>
      ) : (
        <TableWrap>
          <thead><tr><th className={th}>Product</th><th className={th}>SKU</th><th className={th}>Category</th><th className={th}>Price</th><th className={th}>Stock</th><th className={th}>Status</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const stock = r.variantCount > 0 ? r.variantStock : r.stock;
              return (
                <tr key={r.id} className="hover:bg-ivory">
                  <td className={td}>
                    <Link href={`/admin/products/${r.id}`} className="flex items-center gap-3">
                      <ProductImage url={r.image} alt="" className="h-14 w-11 shrink-0 border border-line" />
                      <span><span className="font-medium text-green">{r.name}</span>
                        <span className="block text-xs text-muted">{[r.isFeatured && "Featured", r.isBestseller && "Bestseller", r.isNew && "New"].filter(Boolean).join(" · ")}</span></span>
                    </Link>
                  </td>
                  <td className={td}>{r.sku}</td>
                  <td className={td}>{r.category ?? "-"}</td>
                  <td className={td}>{r.salePrice != null ? <><span className="font-semibold">{formatPrice(r.salePrice)}</span> <span className="text-xs text-muted line-through">{formatPrice(r.regularPrice)}</span></> : formatPrice(r.regularPrice)}</td>
                  <td className={td}><span className={stock <= 0 ? "font-semibold text-danger" : ""}>{stock}</span>{r.variantCount > 0 && <span className="text-xs text-muted"> ({r.variantCount} variants)</span>}</td>
                  <td className={td}><span className={`px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${statusColor[r.status]}`}>{r.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}
      <Pager page={page} totalPages={totalPages} hrefFor={(p) => `/admin/products${qs({ q, status: sp.status, category: sp.category, page: p > 1 ? p : undefined })}`} />
    </div>
  );
}
