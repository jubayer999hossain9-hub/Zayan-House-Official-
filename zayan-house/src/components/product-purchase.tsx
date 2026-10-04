"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Check } from "lucide-react";
import { addToCart } from "@/lib/cart-client";
import { unitPriceFor, discountPercent, sortSizes, MAX_QTY_PER_LINE } from "@/lib/pricing-utils";
import { formatPrice } from "@/lib/format";

type Variant = { id: number; sku: string; size: string | null; color: string | null; colorHex: string | null; price: number | null; stock: number };
type Props = {
  product: { id: number; sku: string; regularPrice: number; salePrice: number | null; stock: number };
  variants: Variant[];
};

export function ProductPurchase({ product, variants }: Props) {
  const router = useRouter();
  const hasVariants = variants.length > 0;

  const colors = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const v of variants) if (v.color && !m.has(v.color)) m.set(v.color, v.colorHex);
    return [...m.entries()].map(([name, hex]) => ({ name, hex }));
  }, [variants]);
  const sizes = useMemo(() => sortSizes([...new Set(variants.map((v) => v.size).filter((s): s is string => !!s))]), [variants]);

  const [color, setColor] = useState<string | null>(colors.length === 1 ? colors[0].name : null);
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const needColor = colors.length > 0;
  const needSize = sizes.length > 0;
  const selected = hasVariants
    ? variants.find((v) => (!needColor || v.color === color) && (!needSize || v.size === size)) ?? null
    : null;
  const ready = !hasVariants || (selected !== null && (!needColor || color !== null) && (!needSize || size !== null));

  const stock = hasVariants ? (ready && selected ? selected.stock : 0) : product.stock;
  const { price, compareAt } = unitPriceFor(product, selected);
  const off = discountPercent(price, compareAt);
  const maxQty = Math.max(1, Math.min(stock, MAX_QTY_PER_LINE));
  const safeQty = Math.min(qty, maxQty);

  const sizeAvailable = (s: string) => variants.some((v) => v.size === s && (!color || v.color === color) && v.stock > 0);
  const colorAvailable = (c: string) => variants.some((v) => v.color === c && (!size || v.size === size) && v.stock > 0);

  const missing = hasVariants && !ready ? `Please select ${[needSize && !size ? "a size" : null, needColor && !color ? "a colour" : null].filter(Boolean).join(" and ")}` : null;
  const canBuy = ready && stock > 0;

  function add(): boolean {
    if (!canBuy) return false;
    addToCart({ productId: product.id, variantId: selected?.id ?? null, qty: safeQty });
    return true;
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-serif text-3xl font-semibold text-green">{formatPrice(price)}</span>
        {compareAt && (
          <>
            <span className="text-lg text-muted line-through">{formatPrice(compareAt)}</span>
            <span className="bg-danger px-2 py-0.5 text-xs font-bold text-white">-{off}%</span>
          </>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">SKU: <span data-testid="sku">{selected?.sku ?? product.sku}</span></p>

      {needColor && (
        <fieldset className="mt-6">
          <legend className="label">Colour{color ? `: ${color}` : ""}</legend>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => { setColor(c.name); setAdded(false); }}
                aria-pressed={color === c.name}
                disabled={!colorAvailable(c.name)}
                title={c.name}
                className={`flex items-center gap-2 border px-3 py-2 text-sm ${color === c.name ? "border-green bg-green text-cream" : "border-line bg-cream hover:border-green"} disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through`}
              >
                {c.hex && <span className="h-4 w-4 rounded-full border border-charcoal/20" style={{ backgroundColor: c.hex }} />}
                {c.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {needSize && (
        <fieldset className="mt-5">
          <legend className="label">Size{size ? `: ${size}` : ""}</legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setSize(s); setAdded(false); }}
                aria-pressed={size === s}
                disabled={!sizeAvailable(s)}
                className={`min-w-12 border px-3 py-2 text-sm ${size === s ? "border-green bg-green text-cream" : "border-line bg-cream hover:border-green"} disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through`}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <p className="mt-5 text-sm" aria-live="polite" data-testid="stock">
        {!ready ? <span className="text-muted">{missing}</span>
          : stock <= 0 ? <span className="font-semibold text-danger">Out of stock</span>
          : stock <= 5 ? <span className="font-semibold text-danger">Only {stock} left</span>
          : <span className="font-semibold text-success">In stock</span>}
      </p>

      <div className="mt-5 flex items-center gap-4">
        <div className="flex items-center border border-line bg-cream">
          <button type="button" aria-label="Decrease quantity" disabled={safeQty <= 1} onClick={() => setQty(safeQty - 1)} className="p-3 disabled:opacity-40"><Minus size={16} /></button>
          <span className="w-10 text-center text-sm" aria-live="polite">{safeQty}</span>
          <button type="button" aria-label="Increase quantity" disabled={safeQty >= maxQty || !canBuy} onClick={() => setQty(safeQty + 1)} className="p-3 disabled:opacity-40"><Plus size={16} /></button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={!canBuy}
          onClick={() => { if (add()) setAdded(true); }}
          className="btn btn-primary flex-1"
        >
          {!ready ? "Select options" : stock <= 0 ? "Out of stock" : "Add to Cart"}
        </button>
        <button
          type="button"
          disabled={!canBuy}
          onClick={() => { if (add()) router.push("/checkout"); }}
          className="btn btn-gold flex-1"
        >
          Buy Now
        </button>
      </div>

      {added && (
        <p role="status" className="mt-4 flex items-center gap-2 border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
          <Check size={16} /> Added to your cart.
          <Link href="/cart" className="ml-auto font-semibold underline">View cart</Link>
        </p>
      )}
    </div>
  );
}
