import "server-only";
import { and, asc, desc, eq, ilike, or, sql, gte, lte, ne, count, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { products, productImages, productVariants, categories } from "@/db/schema";
import { sortSizes } from "./pricing-utils";

import { SORT_OPTIONS } from "./sort-options";
export { SORT_OPTIONS };
export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export type ListParams = {
  q?: string;
  category?: string;
  min?: number;
  max?: number;
  size?: string;
  color?: string;
  sort?: SortKey;
  filter?: "new" | "featured" | "bestseller";
  page?: number;
  pageSize?: number;
  excludeId?: number;
};

export type ProductCardData = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  categoryName: string | null;
  regularPrice: number;
  salePrice: number | null;
  imageUrl: string | null;
  isNew: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
  inStock: boolean;
  hasVariants: boolean;
};

const effectivePrice = sql`coalesce(${products.salePrice}, ${products.regularPrice})`;

const imageSub = sql<string | null>`(select ${productImages.url} from ${productImages} where ${productImages.productId} = ${products.id} order by ${productImages.position}, ${productImages.id} limit 1)`;
const variantCountSub = sql<number>`(select count(*)::int from ${productVariants} where ${productVariants.productId} = ${products.id} and ${productVariants.status} = 'active')`;
const variantStockSub = sql<number>`(select coalesce(sum(${productVariants.stock}), 0)::int from ${productVariants} where ${productVariants.productId} = ${products.id} and ${productVariants.status} = 'active')`;

const cardSelect = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  sku: products.sku,
  categoryName: categories.name,
  regularPrice: products.regularPrice,
  salePrice: products.salePrice,
  stock: products.stock,
  isNew: products.isNewArrival,
  isBestseller: products.isBestseller,
  isFeatured: products.isFeatured,
  imageUrl: imageSub.mapWith(String),
  variantCount: variantCountSub.mapWith(Number),
  variantStock: variantStockSub.mapWith(Number),
};

function toCard(r: {
  id: number; name: string; slug: string; sku: string; categoryName: string | null;
  regularPrice: number; salePrice: number | null; stock: number; isNew: boolean; isBestseller: boolean;
  isFeatured: boolean; imageUrl: string | null; variantCount: number; variantStock: number;
}): ProductCardData {
  const hasVariants = r.variantCount > 0;
  return {
    id: r.id, name: r.name, slug: r.slug, sku: r.sku, categoryName: r.categoryName,
    regularPrice: r.regularPrice, salePrice: r.salePrice, imageUrl: r.imageUrl || null,
    isNew: r.isNew, isBestseller: r.isBestseller, isFeatured: r.isFeatured,
    hasVariants, inStock: hasVariants ? r.variantStock > 0 : r.stock > 0,
  };
}

function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

function buildWhere(p: ListParams): SQL {
  const conds: (SQL | undefined)[] = [eq(products.status, "active")];
  if (p.excludeId) conds.push(ne(products.id, p.excludeId));
  if (p.q) {
    const like = `%${escapeLike(p.q)}%`;
    conds.push(
      or(
        ilike(products.name, like),
        ilike(products.sku, like),
        ilike(categories.name, like),
        sql`exists (select 1 from ${productVariants} where ${productVariants.productId} = ${products.id} and ${productVariants.sku} ilike ${like})`,
      ),
    );
  }
  if (p.category) conds.push(eq(categories.slug, p.category));
  if (p.min != null) conds.push(gte(effectivePrice, p.min));
  if (p.max != null) conds.push(lte(effectivePrice, p.max));
  if (p.size) {
    conds.push(sql`exists (select 1 from ${productVariants} where ${productVariants.productId} = ${products.id} and ${productVariants.status} = 'active' and ${productVariants.size} = ${p.size})`);
  }
  if (p.color) {
    conds.push(sql`exists (select 1 from ${productVariants} where ${productVariants.productId} = ${products.id} and ${productVariants.status} = 'active' and ${productVariants.color} = ${p.color})`);
  }
  if (p.filter === "new") conds.push(eq(products.isNewArrival, true));
  if (p.filter === "featured") conds.push(eq(products.isFeatured, true));
  if (p.filter === "bestseller") conds.push(eq(products.isBestseller, true));
  return and(...conds) as SQL;
}

function buildOrder(sort: SortKey | undefined): SQL[] {
  switch (sort) {
    case "price_asc": return [asc(effectivePrice), desc(products.id)];
    case "price_desc": return [desc(effectivePrice), desc(products.id)];
    case "best_selling": return [desc(products.soldCount), desc(products.isBestseller), desc(products.id)];
    case "featured": return [desc(products.isFeatured), desc(products.createdAt), desc(products.id)];
    default: return [desc(products.createdAt), desc(products.id)];
  }
}

export async function listProducts(params: ListParams = {}) {
  const pageSize = Math.min(Math.max(params.pageSize ?? 12, 1), 48);
  const page = Math.max(params.page ?? 1, 1);
  const where = buildWhere(params);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select(cardSelect)
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(...buildOrder(params.sort))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ total: count() })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where),
  ]);

  return {
    items: rows.map(toCard),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Distinct sizes and colours that exist on active products (for the shop filters). */
export async function getFacets() {
  const rows = await db
    .selectDistinct({ size: productVariants.size, color: productVariants.color, colorHex: productVariants.colorHex })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(and(eq(products.status, "active"), eq(productVariants.status, "active")));
  const sizes = sortSizes([...new Set(rows.map((r) => r.size).filter((s): s is string => !!s))]);
  const colorMap = new Map<string, string | null>();
  for (const r of rows) if (r.color && !colorMap.has(r.color)) colorMap.set(r.color, r.colorHex);
  const colors = [...colorMap.entries()].map(([name, hex]) => ({ name, hex })).sort((a, b) => a.name.localeCompare(b.name));
  return { sizes, colors };
}

export async function getProductBySlug(slug: string) {
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      shortDescription: products.shortDescription,
      description: products.description,
      productDetails: products.productDetails,
      regularPrice: products.regularPrice,
      salePrice: products.salePrice,
      stock: products.stock,
      isNew: products.isNewArrival,
      isBestseller: products.isBestseller,
      seoTitle: products.seoTitle,
      seoDescription: products.seoDescription,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.status, "active")))
    .limit(1);
  if (!product) return null;

  const [images, variants] = await Promise.all([
    db
      .select({ id: productImages.id, url: productImages.url, alt: productImages.alt })
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.position), asc(productImages.id)),
    db
      .select({
        id: productVariants.id,
        sku: productVariants.sku,
        size: productVariants.size,
        color: productVariants.color,
        colorHex: productVariants.colorHex,
        price: productVariants.price,
        stock: productVariants.stock,
      })
      .from(productVariants)
      .where(and(eq(productVariants.productId, product.id), eq(productVariants.status, "active")))
      .orderBy(asc(productVariants.id)),
  ]);
  return { ...product, images, variants };
}

export async function getRelatedProducts(productId: number, categoryId: number | null, limit = 4) {
  if (categoryId == null) {
    return (await listProducts({ excludeId: productId, pageSize: limit, sort: "featured" })).items;
  }
  const rows = await db
    .select(cardSelect)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.status, "active"), eq(products.categoryId, categoryId), ne(products.id, productId)))
    .orderBy(desc(products.isFeatured), desc(products.createdAt))
    .limit(limit);
  return rows.map(toCard);
}
