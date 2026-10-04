"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart, useCartMeta, setLineQty, removeLine, updateCartMeta, saveCart } from "@/lib/cart-client";
import { previewCartAction } from "@/app/actions/cart";
import type { CartPreview } from "@/lib/cart-resolve";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./product-image";

export function CartView() {
  const { items, mounted } = useCart();
  const meta = useCartMeta();
  const [preview, setPreview] = useState<CartPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const seq = useRef(0);

  const itemsKey = JSON.stringify(items);

  useEffect(() => {
    if (!mounted) return;
    if (items.length === 0) return;
    const mine = ++seq.current;
    previewCartAction({ items, couponCode: meta.couponCode || null, zoneSlug: meta.zoneSlug || null }).then((res) => {
      if (mine !== seq.current) return;
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setError(null);
      setPreview(res.preview);
      // Keep the saved cart in step with what is really available.
      const fixed = res.preview.lines
        .filter((l) => l.status !== "unavailable")
        .map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty }));
      if (res.preview.lines.some((l) => l.status !== "ok")) {
        const msgs = res.preview.lines.filter((l) => l.note).map((l) => `${l.name}: ${l.note}`);
        setNotice(msgs.join(" "));
        saveCart(fixed);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, itemsKey, meta.couponCode, meta.zoneSlug]);

  if (!mounted) return <div className="h-64" aria-busy="true" />;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md border border-line bg-cream p-10 text-center">
        <h2 className="text-3xl text-green">Your cart is empty</h2>
        <p className="mt-2 text-muted">Discover something you love.</p>
        {notice && <p role="status" className="mt-4 text-sm text-danger">{notice}</p>}
        <Link href="/shop" className="btn btn-primary mt-6">Continue Shopping</Link>
      </div>
    );
  }

  if (error && !preview) {
    return (
      <div role="alert" className="border border-danger/30 bg-danger/5 p-8 text-center">
        <p className="text-danger">{error}</p>
        <button type="button" onClick={() => updateCartMeta({})} className="btn btn-outline mt-5">Try again</button>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="flex h-64 items-center justify-center" role="status" aria-label="Loading cart">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-green" />
      </div>
    );
  }

  const zone = preview.zone;
  const lines = preview.lines.filter((l) => l.status !== "unavailable");

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        {notice && <p role="status" className="mb-4 border border-gold/50 bg-gold/10 px-4 py-3 text-sm">{notice}</p>}
        <ul className="divide-y divide-line border-y border-line">
          {lines.map((l) => (
            <li key={`${l.productId}:${l.variantId ?? 0}`} className="flex gap-4 py-5">
              <Link href={`/products/${l.slug}`} className="block w-24 shrink-0 overflow-hidden border border-line sm:w-28">
                <ProductImage url={l.imageUrl} alt={l.name} className="aspect-[3/4] w-full" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/products/${l.slug}`} className="font-medium text-charcoal hover:text-green">{l.name}</Link>
                    <p className="mt-1 text-xs text-muted">
                      {[l.size && `Size: ${l.size}`, l.color && `Colour: ${l.color}`].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-xs text-muted">SKU: {l.sku}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${l.name}`}
                    onClick={() => removeLine(l.productId, l.variantId)}
                    className="h-fit p-1 text-muted hover:text-danger"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                  <div className="flex items-center border border-line bg-cream">
                    <button type="button" aria-label="Decrease quantity" onClick={() => setLineQty(l.productId, l.variantId, l.qty - 1)} className="p-2.5"><Minus size={14} /></button>
                    <span className="w-9 text-center text-sm">{l.qty}</span>
                    <button type="button" aria-label="Increase quantity" disabled={l.qty >= Math.min(l.stock, 10)} onClick={() => setLineQty(l.productId, l.variantId, l.qty + 1)} className="p-2.5 disabled:opacity-40"><Plus size={14} /></button>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-xs text-muted">
                      {formatPrice(l.unitPrice)} each{l.compareAt ? <span className="ml-1 line-through">{formatPrice(l.compareAt)}</span> : null}
                    </p>
                    <p className="font-semibold text-green">{formatPrice(l.unitPrice * l.qty)}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/shop" className="mt-6 inline-block border-b border-green pb-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-green hover:border-gold">
          ← Continue Shopping
        </Link>
      </div>

      <aside className="h-fit border border-line bg-cream p-6" aria-label="Order summary">
        <h2 className="text-2xl text-green">Order Summary</h2>

        <div className="mt-5">
          <label htmlFor="coupon" className="label">Coupon code</label>
          <div className="flex gap-2">
            <input id="coupon" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder={meta.couponCode || "Enter code"} maxLength={40} className="field" />
            <button type="button" className="btn btn-outline !px-4" onClick={() => updateCartMeta({ couponCode: couponInput.trim() })}>Apply</button>
          </div>
          {preview.couponCode && (
            <p className="mt-2 flex items-center justify-between text-sm text-success">
              <span>Coupon {preview.couponCode} applied</span>
              <button type="button" className="text-xs underline" onClick={() => { updateCartMeta({ couponCode: "" }); setCouponInput(""); }}>Remove</button>
            </p>
          )}
          {preview.couponError && <p role="alert" className="field-error">{preview.couponError}</p>}
        </div>

        {preview.zones.length > 0 && (
          <div className="mt-5">
            <label htmlFor="zone" className="label">Delivery area</label>
            <select id="zone" className="field" value={zone?.slug ?? ""} onChange={(e) => updateCartMeta({ zoneSlug: e.target.value })}>
              {preview.zones.map((z) => <option key={z.slug} value={z.slug}>{z.name} ({formatPrice(z.charge)})</option>)}
            </select>
            <p className="mt-1 text-xs text-muted">Final delivery charge is set from your district at checkout.</p>
          </div>
        )}

        <dl className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(preview.subtotal)}</dd></div>
          {preview.discount > 0 && <div className="flex justify-between text-success"><dt>Discount</dt><dd>-{formatPrice(preview.discount)}</dd></div>}
          <div className="flex justify-between">
            <dt className="text-muted">Delivery{zone ? ` (${zone.name})` : ""}</dt>
            <dd>{preview.deliveryCharge === 0 ? "Free" : formatPrice(preview.deliveryCharge)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-green">
            <dt>Total</dt><dd data-testid="cart-total">{formatPrice(preview.total)}</dd>
          </div>
        </dl>

        <Link href="/checkout" className="btn btn-primary mt-6 w-full">Proceed to Checkout</Link>
        <p className="mt-3 text-center text-xs text-muted">Cash on Delivery available</p>
      </aside>
    </div>
  );
}
