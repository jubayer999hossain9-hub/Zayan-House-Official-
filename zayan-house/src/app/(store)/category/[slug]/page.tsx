import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { ShopView } from "@/components/shop-view";
import { parseShopParams } from "@/lib/shop-params";

export const dynamic = "force-dynamic";

async function getCategory(slug: string) {
  const [c] = await db.select().from(categories).where(and(eq(categories.slug, slug), eq(categories.isActive, true))).limit(1);
  return c ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCategory(slug);
  if (!c) return { title: "Category not found" };
  return {
    title: c.seoTitle || c.name,
    description: c.seoDescription || c.description || `Shop ${c.name} at Zayan House.`,
    alternates: { canonical: `/category/${c.slug}` },
  };
}

export default async function CategoryPage({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const c = await getCategory(slug);
  if (!c) notFound();
  const listParams = parseShopParams(await searchParams);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl text-green sm:text-5xl">{c.name}</h1>
      {c.description && <p className="mb-8 mt-2 max-w-2xl text-muted">{c.description}</p>}
      <ShopView params={listParams} basePath={`/category/${c.slug}`} fixedCategory={c.slug} />
    </div>
  );
}
