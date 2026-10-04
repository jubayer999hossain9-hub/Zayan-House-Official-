/** Helpers shared by server and browser code. Money is whole Taka. */

export type PriceInfo = { price: number; compareAt: number | null };

/** Price a customer pays for one unit, plus the "was" price to show struck through (if any). */
export function unitPriceFor(
  product: { regularPrice: number; salePrice: number | null },
  variant?: { price: number | null } | null,
): PriceInfo {
  if (variant?.price != null) return { price: variant.price, compareAt: null };
  if (product.salePrice != null && product.salePrice < product.regularPrice) {
    return { price: product.salePrice, compareAt: product.regularPrice };
  }
  return { price: product.regularPrice, compareAt: null };
}

export function discountPercent(price: number, compareAt: number | null): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "FREE"];
export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a.toUpperCase());
    const ib = SIZE_ORDER.indexOf(b.toUpperCase());
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b, undefined, { numeric: true });
  });
}

export const MAX_QTY_PER_LINE = 10;
export const MAX_CART_LINES = 30;
