import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { unitPriceFor, discountPercent } from "@/lib/pricing-utils";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./product-image";
import { QuickAdd } from "./quick-add";

export function ProductCard({ product: p }: { product: ProductCardData }) {
  const { price, compareAt } = unitPriceFor(p);
  const off = discountPercent(price, compareAt);
  const href = `/products/${p.slug}`;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-shadow duration-300 hover:shadow-soft">
      <Link href={href} className="relative block overflow-hidden bg-cream" aria-label={p.name}>
        <ProductImage
          url={p.imageUrl}
          alt={p.name}
          className="aspect-[4/5] w-full transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {off > 0 && <span className="rounded-full bg-danger px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-white">-{off}%</span>}
          {p.isNew && <span className="rounded-full bg-green px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-cream">New</span>}
          {p.isBestseller && <span className="rounded-full bg-[#c9742c] px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-white">Best Seller</span>}
        </div>
        {!p.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-cream/70">
            <span className="rounded-full border border-charcoal/30 bg-cream px-3.5 py-1 text-xs font-semibold uppercase tracking-widest">Out of stock</span>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {p.categoryName && <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted">{p.categoryName}</p>}
        <h3 className="mt-1 font-sans text-sm font-semibold leading-snug text-charcoal sm:text-[0.95rem]">
          <Link href={href} className="hover:text-green">{p.name}</Link>
        </h3>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-bold text-green">{formatPrice(price)}</span>
          {compareAt && <span className="text-xs text-muted line-through">{formatPrice(compareAt)}</span>}
        </p>
        <div className="mt-auto pt-3.5">
          {p.hasVariants ? (
            <Link href={href} className="flex w-full items-center justify-center rounded-lg bg-green px-3 py-2.5 text-xs font-semibold tracking-wide text-cream transition-colors hover:bg-green-dark">
              {p.inStock ? "Select Options" : "View"}
            </Link>
          ) : (
            <QuickAdd productId={p.id} disabled={!p.inStock} />
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
