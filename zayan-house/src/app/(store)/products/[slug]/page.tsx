import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { getActiveZones } from "@/lib/cart-resolve";
import { unitPriceFor } from "@/lib/pricing-utils";
import { formatPrice } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchase } from "@/components/product-purchase";
import { ProductGrid } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  const description = p.seoDescription || p.shortDescription || `Buy ${p.name} at Zayan House.`;
  return {
    title: p.seoTitle || p.name,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title: p.name, description, type: "website", images: p.images[0] ? [p.images[0].url] : ["/logo.png"] },
  };
}

function Accordion({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-line py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold uppercase tracking-[0.16em] text-green">
        {title}
        <span className="text-lg transition-transform group-open:rotate-45" aria-hidden>+</span>
      </summary>
      <div className="mt-3 text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, zones] = await Promise.all([
    getRelatedProducts(product.id, product.categoryId),
    getActiveZones().catch(() => []),
  ]);

  const { price } = unitPriceFor(product);
  const totalStock = product.variants.length ? product.variants.reduce((s, v) => s + v.stock, 0) : product.stock;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.shortDescription || product.description || undefined,
    image: product.images.map((i) => (i.url.startsWith("http") ? i.url : `${SITE_URL}${i.url}`)),
    brand: { "@type": "Brand", name: "Zayan House" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: "BDT",
      price,
      availability: totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted">
        <Link href="/" className="hover:text-green">Home</Link> /{" "}
        <Link href="/shop" className="hover:text-green">Shop</Link>
        {product.categorySlug && (<> / <Link href={`/category/${product.categorySlug}`} className="hover:text-green">{product.categoryName}</Link></>)}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} name={product.name} />
        <div>
          {product.categoryName && <p className="text-xs uppercase tracking-[0.2em] text-muted">{product.categoryName}</p>}
          <h1 className="mt-2 text-4xl text-green sm:text-5xl">{product.name}</h1>
          {product.shortDescription && <p className="mt-3 text-muted">{product.shortDescription}</p>}
          <div className="mt-6">
            <ProductPurchase
              product={{ id: product.id, sku: product.sku, regularPrice: product.regularPrice, salePrice: product.salePrice, stock: product.stock }}
              variants={product.variants}
            />
          </div>

          <div className="mt-10 border-t border-line">
            <Accordion title="Description" open>
              {product.description ? <p className="whitespace-pre-line">{product.description}</p> : <p>Details coming soon.</p>}
            </Accordion>
            <Accordion title="Product Details">
              {product.productDetails ? <p className="whitespace-pre-line">{product.productDetails}</p> : <p>SKU: {product.sku}{product.categoryName ? ` · Category: ${product.categoryName}` : ""}</p>}
            </Accordion>
            <Accordion title="Shipping">
              <p>
                We deliver across Bangladesh.{" "}
                {zones.length > 0 && zones.map((z) => `${z.name}: ${formatPrice(z.charge)}${z.freeThreshold ? ` (free over ${formatPrice(z.freeThreshold)})` : ""}`).join(" · ")}
                {" "}Payment is Cash on Delivery. See our <Link href="/shipping" className="underline">shipping policy</Link>.
              </p>
            </Accordion>
            <Accordion title="Returns">
              <p>Not right for you? See our <Link href="/returns" className="underline">returns &amp; refunds policy</Link> for how exchanges and returns work.</p>
            </Accordion>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <SectionHeading eyebrow="You may also like" title="Related Products" />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
