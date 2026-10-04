import "server-only";
import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, productImages, productVariants, deliveryZones, coupons } from "@/db/schema";
import { evaluateCoupon } from "./coupons";
import { unitPriceFor, MAX_QTY_PER_LINE, MAX_CART_LINES } from "./pricing-utils";

export type CartLineInput = { productId: number; variantId: number | null; qty: number };

export type PreviewLine = {
  productId: number;
  variantId: number | null;
  name: string;
  slug: string;
  sku: string;
  size: string | null;
  color: string | null;
  imageUrl: string | null;
  unitPrice: number;
  compareAt: number | null;
  qty: number;
  stock: number;
  status: "ok" | "adjusted" | "unavailable";
  note?: string;
};

export type ZoneInfo = { slug: string; name: string; charge: number; freeThreshold: number | null };

export type CartPreview = {
  lines: PreviewLine[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  couponError: string | null;
  deliveryCharge: number;
  zone: ZoneInfo | null;
  zones: ZoneInfo[];
  total: number;
  hasProblems: boolean;
};

export function mergeLines(items: CartLineInput[]): CartLineInput[] {
  const map = new Map<string, CartLineInput>();
  for (const i of items) {
    const key = `${i.productId}:${i.variantId ?? 0}`;
    const prev = map.get(key);
    if (prev) prev.qty += i.qty;
    else map.set(key, { ...i });
  }
  return [...map.values()].slice(0, MAX_CART_LINES).map((l) => ({ ...l, qty: Math.min(l.qty, MAX_QTY_PER_LINE) }));
}

export async function getActiveZones(): Promise<ZoneInfo[]> {
  const rows = await db
    .select()
    .from(deliveryZones)
    .where(eq(deliveryZones.isActive, true))
    .orderBy(asc(deliveryZones.sortOrder), asc(deliveryZones.id));
  return rows.map((z) => ({ slug: z.slug, name: z.name, charge: z.charge, freeThreshold: z.freeDeliveryThreshold }));
}

export function deliveryFor(zone: ZoneInfo | null, subtotal: number): number {
  if (!zone) return 0;
  if (zone.freeThreshold != null && subtotal >= zone.freeThreshold) return 0;
  return zone.charge;
}

/** Prices a cart from the database (never from browser-supplied prices). Read-only, used for display. */
export async function previewCart(
  rawItems: CartLineInput[],
  couponCode: string | null,
  zoneSlug: string | null,
): Promise<CartPreview> {
  const items = mergeLines(rawItems);
  const zones = await getActiveZones();
  const zone = zones.find((z) => z.slug === zoneSlug) ?? zones[0] ?? null;

  const productIds = [...new Set(items.map((i) => i.productId))];
  const variantIds = items.map((i) => i.variantId).filter((v): v is number => v != null);

  // Plain separate queries (no sub-queries) so every column is unambiguous.
  const [productRows, variantRows, variantCounts, imageRows] = productIds.length
    ? await Promise.all([
        db
          .select({
            id: products.id, name: products.name, slug: products.slug, sku: products.sku,
            regularPrice: products.regularPrice, salePrice: products.salePrice, stock: products.stock, status: products.status,
          })
          .from(products)
          .where(inArray(products.id, productIds)),
        variantIds.length
          ? db.select().from(productVariants).where(inArray(productVariants.id, variantIds))
          : Promise.resolve([]),
        db
          .select({ productId: productVariants.productId, n: count() })
          .from(productVariants)
          .where(and(inArray(productVariants.productId, productIds), eq(productVariants.status, "active")))
          .groupBy(productVariants.productId),
        db
          .select({ productId: productImages.productId, url: productImages.url })
          .from(productImages)
          .where(inArray(productImages.productId, productIds))
          .orderBy(asc(productImages.position), asc(productImages.id)),
      ])
    : [[], [], [], []];

  const lines: PreviewLine[] = [];
  for (const item of items) {
    const found = productRows.find((r) => r.id === item.productId);
    const p = found && {
      ...found,
      imageUrl: imageRows.find((i) => i.productId === found.id)?.url ?? null,
      activeVariants: variantCounts.find((c) => c.productId === found.id)?.n ?? 0,
    };
    const v = item.variantId != null ? variantRows.find((r) => r.id === item.variantId) : null;
    const base = { productId: item.productId, variantId: item.variantId };

    if (!p || p.status !== "active") {
      lines.push({ ...base, name: "Unavailable product", slug: "", sku: "", size: null, color: null, imageUrl: null, unitPrice: 0, compareAt: null, qty: 0, stock: 0, status: "unavailable", note: "This product is no longer available." });
      continue;
    }
    const needsVariant = p.activeVariants > 0;
    if ((needsVariant && (!v || v.productId !== p.id || v.status !== "active")) || (!needsVariant && item.variantId != null)) {
      lines.push({ ...base, name: p.name, slug: p.slug, sku: p.sku, size: null, color: null, imageUrl: p.imageUrl, unitPrice: 0, compareAt: null, qty: 0, stock: 0, status: "unavailable", note: "This option is no longer available." });
      continue;
    }
    const stock = v ? v.stock : p.stock;
    const { price, compareAt } = unitPriceFor(p, v);
    const common = {
      ...base, name: p.name, slug: p.slug, sku: v ? v.sku : p.sku, size: v?.size ?? null, color: v?.color ?? null,
      imageUrl: p.imageUrl, unitPrice: price, compareAt, stock,
    };
    if (stock <= 0) {
      lines.push({ ...common, qty: 0, status: "unavailable", note: "Out of stock." });
    } else if (item.qty > stock) {
      lines.push({ ...common, qty: stock, status: "adjusted", note: `Only ${stock} left in stock. Quantity updated.` });
    } else {
      lines.push({ ...common, qty: item.qty, status: "ok" });
    }
  }

  const valid = lines.filter((l) => l.status !== "unavailable");
  const subtotal = valid.reduce((s, l) => s + l.unitPrice * l.qty, 0);

  let discount = 0;
  let appliedCode: string | null = null;
  let couponError: string | null = null;
  const code = couponCode?.trim();
  if (code) {
    const [c] = await db.select().from(coupons).where(sql`upper(${coupons.code}) = ${code.toUpperCase()}`).limit(1);
    const res = evaluateCoupon(c, subtotal);
    if (res.ok) {
      discount = res.discount;
      appliedCode = c!.code;
    } else {
      couponError = res.error;
    }
  }

  const deliveryCharge = valid.length ? deliveryFor(zone, subtotal) : 0;
  return {
    lines,
    subtotal,
    discount,
    couponCode: appliedCode,
    couponError,
    deliveryCharge,
    zone,
    zones,
    total: Math.max(0, subtotal - discount + deliveryCharge),
    hasProblems: lines.some((l) => l.status !== "ok"),
  };
}

