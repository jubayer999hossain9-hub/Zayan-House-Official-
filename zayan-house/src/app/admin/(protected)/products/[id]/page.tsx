import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, productVariants, productImages, categories } from "@/db/schema";
import { PageHeader, Flash } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { ImageManager } from "@/components/admin/image-manager";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { deleteProduct } from "@/app/actions/admin-products";

export const metadata: Metadata = { title: "Edit Product" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id: idRaw } = await params;
  if (!/^\d+$/.test(idRaw)) notFound();
  const id = Number(idRaw);
  const sp = await searchParams;
  const [p] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!p) notFound();
  const [variants, images, cats] = await Promise.all([
    db.select().from(productVariants).where(eq(productVariants.productId, id)).orderBy(asc(productVariants.id)),
    db.select({ id: productImages.id, url: productImages.url }).from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.position), asc(productImages.id)),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.displayOrder),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={p.name} subtitle={`SKU ${p.sku}`} action={p.status === "active" ? <Link href={`/products/${p.slug}`} target="_blank" className="btn btn-outline">View in shop</Link> : undefined} />
      <Flash ok={sp.ok} error={sp.error} />
      <ImageManager productId={p.id} images={images} productName={p.name} />
      <ProductForm
        key={p.updatedAt.getTime()}
        categories={cats}
        initial={{
          id: p.id, name: p.name, slug: p.slug, sku: p.sku, categoryId: p.categoryId, shortDescription: p.shortDescription ?? "", description: p.description ?? "",
          productDetails: p.productDetails ?? "", regularPrice: String(p.regularPrice), salePrice: p.salePrice != null ? String(p.salePrice) : "",
          costPrice: p.costPrice != null ? String(p.costPrice) : "", stock: String(p.stock), status: p.status, isFeatured: p.isFeatured,
          isBestseller: p.isBestseller, isNewArrival: p.isNewArrival, seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "",
        }}
        variants={variants.map((v) => ({ id: v.id, size: v.size ?? "", color: v.color ?? "", colorHex: v.colorHex ?? "", sku: v.sku, price: v.price != null ? String(v.price) : "", stock: String(v.stock), status: v.status }))}
      />
      <section className="border border-danger/30 bg-cream p-5">
        <h2 className="text-xl text-danger">Delete product</h2>
        <p className="mb-4 mt-1 text-sm text-muted">This permanently removes the product, its variants and photos. Past orders keep their own copy of the product details. To simply hide it, set the status to Draft or Archived instead.</p>
        <form action={deleteProduct}><input type="hidden" name="id" value={p.id} /><ConfirmButton message={`Delete "${p.name}" permanently?`} className="btn border border-danger text-danger hover:bg-danger hover:text-white">Delete product</ConfirmButton></form>
      </section>
    </div>
  );
}
