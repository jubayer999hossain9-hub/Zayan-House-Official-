import type { Metadata } from "next";
import { ShopView } from "@/components/shop-view";
import { parseShopParams } from "@/lib/shop-params";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const p = parseShopParams(await searchParams);
  const filtered = !!(p.q || p.category || p.min != null || p.max != null || p.size || p.color || p.filter || (p.page && p.page > 1));
  return {
    title: p.q ? `Search: ${p.q}` : "Shop All",
    description: "Shop Zayan House women's fashion: kurti, saree, three piece and party wear.",
    alternates: { canonical: "/shop" },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = parseShopParams(await searchParams);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-4xl text-green sm:text-5xl">Shop</h1>
      <ShopView params={params} basePath="/shop" />
    </div>
  );
}
