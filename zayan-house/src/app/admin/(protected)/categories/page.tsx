import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { deleteCategory } from "@/app/actions/admin-site";
import { PageHeader, Flash, TableWrap, th, td } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/category-form";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const metadata: Metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function AdminCategories({ searchParams }: { searchParams: Promise<{ edit?: string; ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const rows = await db
    .select({ c: categories, count: sql<number>`count(${products.id})::int`.mapWith(Number) })
    .from(categories).leftJoin(products, eq(products.categoryId, categories.id)).groupBy(categories.id).orderBy(asc(categories.displayOrder), asc(categories.name));
  const editing = sp.edit && /^\d+$/.test(sp.edit) ? rows.find((r) => r.c.id === Number(sp.edit))?.c : undefined;
  return (
    <div>
      <PageHeader title="Categories" />
      <Flash ok={sp.ok} error={sp.error} />
      <CategoryForm key={editing?.id ?? "new"} initial={editing ? {
        id: editing.id, name: editing.name, slug: editing.slug, description: editing.description ?? "", displayOrder: String(editing.displayOrder),
        isActive: editing.isActive, seoTitle: editing.seoTitle ?? "", seoDescription: editing.seoDescription ?? "", imageUrl: editing.imageUrl ?? "",
      } : { name: "", slug: "", description: "", displayOrder: String(rows.length + 1), isActive: true, seoTitle: "", seoDescription: "", imageUrl: "" }} />
      {rows.length === 0 ? <p className="border border-line bg-cream p-10 text-center text-muted">No categories yet. Add your first one above.</p> : (
        <TableWrap>
          <thead><tr><th className={th}>Order</th><th className={th}>Name</th><th className={th}>Address</th><th className={th}>Products</th><th className={th}>Visible</th><th className={th}>Actions</th></tr></thead>
          <tbody>{rows.map(({ c, count }) => (
            <tr key={c.id}>
              <td className={td}>{c.displayOrder}</td>
              <td className={`${td} font-medium text-green`}>{c.name}</td>
              <td className={`${td} text-xs text-muted`}>/category/{c.slug}</td>
              <td className={td}>{count}</td>
              <td className={td}>{c.isActive ? "Yes" : "No"}</td>
              <td className={td}><div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider">
                <Link href={`/admin/categories?edit=${c.id}`} className="text-green underline">Edit</Link>
                <form action={deleteCategory}><input type="hidden" name="id" value={c.id} /><ConfirmButton message={`Delete "${c.name}"? Its products will stay but have no category.`} className="text-danger underline">Delete</ConfirmButton></form>
              </div></td>
            </tr>
          ))}</tbody>
        </TableWrap>
      )}
    </div>
  );
}
