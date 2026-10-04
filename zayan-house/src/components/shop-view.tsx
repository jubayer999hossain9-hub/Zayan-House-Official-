import Link from "next/link";
import { Suspense } from "react";
import { listProducts, getFacets, type ListParams } from "@/lib/catalog";
import { getActiveCategories } from "@/lib/catalog-nav";
import { shopQuery } from "@/lib/shop-params";
import { ProductGrid } from "./product-card";
import { SortSelect } from "./sort-select";

/**
 * Shared product listing (search, filters, sort, pagination) used by /shop and /category/[slug].
 * Everything is a normal link/form, so it works without JavaScript and every filter state has a real URL.
 */
export async function ShopView({
  params, basePath, fixedCategory,
}: { params: ListParams; basePath: string; fixedCategory?: string }) {
  const effective: ListParams = { ...params, category: fixedCategory ?? params.category, pageSize: 12 };
  let result: Awaited<ReturnType<typeof listProducts>> | null = null;
  let facets: Awaited<ReturnType<typeof getFacets>> = { sizes: [], colors: [] };
  let categories: Awaited<ReturnType<typeof getActiveCategories>> = [];
  try {
    [result, facets, categories] = await Promise.all([listProducts(effective), getFacets(), getActiveCategories()]);
  } catch (error) {
    console.error("Shop query failed:", error);
  }

  if (!result) {
    return (
      <div role="alert" className="border border-danger/30 bg-danger/5 p-8 text-center">
        <p className="text-lg text-danger">We could not load products right now.</p>
        <Link href={basePath} className="btn btn-outline mt-5">Try again</Link>
      </div>
    );
  }

  const hasFilters = !!(params.q || params.min != null || params.max != null || params.size || params.color || params.filter || (!fixedCategory && params.category));
  const heading = params.q ? `Results for “${params.q}”` : params.filter === "new" ? "New Arrivals" : params.filter === "featured" ? "Featured" : params.filter === "bestseller" ? "Best Sellers" : null;
  const link = (page: number) => `${basePath}${shopQuery(effective, { page: page > 1 ? page : undefined, category: fixedCategory ? undefined : effective.category })}`;

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside>
        <details className="group border border-line bg-cream lg:!block" open>
          <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-green lg:pointer-events-none">
            Filters
          </summary>
          <form action={basePath} method="get" className="space-y-5 border-t border-line p-4">
            {params.sort && <input type="hidden" name="sort" value={params.sort} />}
            {params.filter && <input type="hidden" name="filter" value={params.filter} />}
            <div>
              <label htmlFor="f-q" className="label">Search</label>
              <input id="f-q" name="q" defaultValue={params.q ?? ""} maxLength={100} placeholder="Name, SKU or category" className="field" />
            </div>
            {!fixedCategory && (
              <div>
                <label htmlFor="f-cat" className="label">Category</label>
                <select id="f-cat" name="category" defaultValue={params.category ?? ""} className="field">
                  <option value="">All categories</option>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <span className="label">Price (৳)</span>
              <div className="flex items-center gap-2">
                <input name="min" inputMode="numeric" pattern="[0-9]*" defaultValue={params.min ?? ""} placeholder="Min" aria-label="Minimum price" className="field" />
                <span className="text-muted">–</span>
                <input name="max" inputMode="numeric" pattern="[0-9]*" defaultValue={params.max ?? ""} placeholder="Max" aria-label="Maximum price" className="field" />
              </div>
            </div>
            {facets.sizes.length > 0 && (
              <div>
                <label htmlFor="f-size" className="label">Size</label>
                <select id="f-size" name="size" defaultValue={params.size ?? ""} className="field">
                  <option value="">Any size</option>
                  {facets.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            {facets.colors.length > 0 && (
              <div>
                <label htmlFor="f-color" className="label">Colour</label>
                <select id="f-color" name="color" defaultValue={params.color ?? ""} className="field">
                  <option value="">Any colour</option>
                  {facets.colors.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary flex-1 !px-3">Apply</button>
              {hasFilters && <Link href={basePath} className="btn btn-outline !px-3">Clear</Link>}
            </div>
          </form>
        </details>
      </aside>

      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            {heading && <h2 className="text-2xl text-green">{heading}</h2>}
            <p className="text-sm text-muted" aria-live="polite">
              {result.total} {result.total === 1 ? "product" : "products"}
            </p>
          </div>
          <Suspense fallback={null}>
            <SortSelect value={params.sort ?? "newest"} />
          </Suspense>
        </div>

        {result.items.length === 0 ? (
          <div className="border border-line bg-cream p-10 text-center">
            <h3 className="text-2xl text-green">No products found</h3>
            <p className="mt-2 text-muted">
              {hasFilters ? "Try changing or clearing your filters." : "New styles are on the way. Please check back soon."}
            </p>
            {hasFilters && <Link href={basePath} className="btn btn-primary mt-6">Clear filters</Link>}
          </div>
        ) : (
          <>
            <ProductGrid products={result.items} />
            {result.totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
                {result.page > 1 && <Link href={link(result.page - 1)} className="btn btn-outline !px-4">Previous</Link>}
                <span className="px-3 text-sm text-muted">Page {result.page} of {result.totalPages}</span>
                {result.page < result.totalPages && <Link href={link(result.page + 1)} className="btn btn-outline !px-4">Next</Link>}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
