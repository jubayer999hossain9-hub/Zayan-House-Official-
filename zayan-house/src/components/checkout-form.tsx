"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart, useCartMeta, updateCartMeta, clearCart, saveCart } from "@/lib/cart-client";
import { previewCartAction } from "@/app/actions/cart";
import { placeOrderAction } from "@/app/actions/checkout";
import type { CartPreview } from "@/lib/cart-resolve";
import { DISTRICTS, zoneSlugForDistrict } from "@/lib/districts";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./product-image";

type Address = { id: number; label: string; fullName: string; phone: string; address: string; area: string | null; city: string; district: string; postalCode: string | null };
type Props = {
  user: { name: string; email: string; phone: string | null; loggedIn: boolean } | null;
  addresses: Address[];
  codInstructions: string;
};

export function CheckoutForm({ user, addresses, codInstructions }: Props) {
  const router = useRouter();
  const { items, mounted } = useCart();
  const meta = useCartMeta();
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: user?.name ?? "", phone: user?.phone ?? "", email: user?.email ?? "", address: "", area: "",
    city: "", district: "Dhaka", postalCode: "", notes: "",
  });
  const [saveAddress, setSaveAddress] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [preview, setPreview] = useState<CartPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [placed, setPlaced] = useState(false);
  const seq = useRef(0);

  const zoneSlug = zoneSlugForDistrict(form.district);
  const itemsKey = JSON.stringify(items);

  useEffect(() => {
    if (!mounted || items.length === 0) return;
    const mine = ++seq.current;
    previewCartAction({ items, couponCode: meta.couponCode || null, zoneSlug }).then((res) => {
      if (mine !== seq.current) return;
      if (!res.ok) return setPreviewError(res.error);
      setPreviewError(null);
      setPreview(res.preview);
      if (res.preview.lines.some((l) => l.status !== "ok")) {
        saveCart(res.preview.lines.filter((l) => l.status !== "unavailable").map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, itemsKey, meta.couponCode, zoneSlug]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function fillAddress(id: string) {
    const a = addresses.find((x) => String(x.id) === id);
    if (!a) return;
    setForm((f) => ({ ...f, name: a.fullName, phone: a.phone, address: a.address, area: a.area ?? "", city: a.city, district: a.district, postalCode: a.postalCode ?? "" }));
  }

  if (placed) {
    return <div className="flex h-64 items-center justify-center" role="status"><div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-green" /></div>;
  }
  if (!mounted) return <div className="h-64" aria-busy="true" />;
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md border border-line bg-cream p-10 text-center">
        <h2 className="text-3xl text-green">Your cart is empty</h2>
        <p className="mt-2 text-muted">Add something to your cart before checking out.</p>
        <Link href="/shop" className="btn btn-primary mt-6">Continue Shopping</Link>
      </div>
    );
  }

  const lines = preview?.lines.filter((l) => l.status !== "unavailable") ?? [];
  const canSubmit = !!preview && lines.length > 0 && !pending;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!preview) return;
    setFormError(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await placeOrderAction({
        items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })),
        ...form,
        couponCode: preview.couponCode ?? "",
        saveAddress: !!user?.loggedIn && saveAddress,
      });
      if (res.ok) {
        setPlaced(true);
        clearCart();
        updateCartMeta({ couponCode: "" });
        router.push(`/order-success/${res.orderNumber}`);
        return;
      }
      setFormError(res.error ?? "Something went wrong. Please try again.");
      setFieldErrors(res.fieldErrors ?? {});
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const err = (k: string) => fieldErrors[k];
  const input = (k: keyof typeof form, label: string, opts: { type?: string; required?: boolean; autoComplete?: string; placeholder?: string } = {}) => (
    <div>
      <label htmlFor={`c-${k}`} className="label">{label}{opts.required && <span className="text-danger"> *</span>}</label>
      <input id={`c-${k}`} name={k} value={form[k]} onChange={set(k)} type={opts.type ?? "text"} autoComplete={opts.autoComplete} placeholder={opts.placeholder}
        aria-invalid={err(k) ? "true" : undefined} className="field" />
      {err(k) && <p className="field-error">{err(k)}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-8">
        {(formError || previewError) && (
          <p role="alert" className="border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{formError || previewError}</p>
        )}

        <section aria-labelledby="ci" className="border border-line bg-cream p-6">
          <h2 id="ci" className="mb-4 text-2xl text-green">Contact information</h2>
          {!user?.loggedIn && (
            <p className="mb-4 text-sm text-muted">Have an account? <Link href="/login?next=/checkout" className="font-semibold text-green underline">Log in</Link> for faster checkout. Guest checkout is welcome too.</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">{input("name", "Full name", { required: true, autoComplete: "name" })}</div>
            {input("phone", "Mobile number", { required: true, type: "tel", autoComplete: "tel", placeholder: "01XXXXXXXXX" })}
            {input("email", "Email (optional)", { type: "email", autoComplete: "email" })}
          </div>
        </section>

        <section aria-labelledby="da" className="border border-line bg-cream p-6">
          <h2 id="da" className="mb-4 text-2xl text-green">Delivery address</h2>
          {addresses.length > 0 && (
            <div className="mb-4">
              <label htmlFor="saved" className="label">Use a saved address</label>
              <select id="saved" className="field" defaultValue="" onChange={(e) => fillAddress(e.target.value)}>
                <option value="">Choose…</option>
                {addresses.map((a) => <option key={a.id} value={a.id}>{a.label}: {a.address.slice(0, 40)}, {a.district}</option>)}
              </select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">{input("address", "Full address (house, road, area)", { required: true, autoComplete: "street-address" })}</div>
            {input("area", "Area / thana (optional)")}
            {input("city", "City / upazila", { required: true, autoComplete: "address-level2" })}
            <div>
              <label htmlFor="c-district" className="label">District <span className="text-danger">*</span></label>
              <select id="c-district" name="district" value={form.district} onChange={set("district")} aria-invalid={err("district") ? "true" : undefined} className="field">
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {err("district") && <p className="field-error">{err("district")}</p>}
            </div>
            {input("postalCode", "Postal code (optional)")}
            <div className="sm:col-span-2">
              <label htmlFor="c-notes" className="label">Order notes (optional)</label>
              <textarea id="c-notes" name="notes" value={form.notes} onChange={set("notes")} rows={3} maxLength={500} className="field" />
            </div>
          </div>
          {user?.loggedIn && (
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} /> Save this address to my account
            </label>
          )}
        </section>

        <section aria-labelledby="pm" className="border border-line bg-cream p-6">
          <h2 id="pm" className="mb-4 text-2xl text-green">Payment</h2>
          <label className="flex items-start gap-3 border border-green bg-ivory p-4">
            <input type="radio" name="payment" checked readOnly className="mt-1" />
            <span>
              <span className="block font-semibold text-green">Cash on Delivery</span>
              <span className="text-sm text-muted">{codInstructions}</span>
            </span>
          </label>
        </section>
      </div>

      <aside className="h-fit border border-line bg-cream p-6 lg:sticky lg:top-28" aria-label="Order summary">
        <h2 className="text-2xl text-green">Order Summary</h2>
        {!preview ? (
          <div className="flex h-32 items-center justify-center" role="status"><div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-green" /></div>
        ) : (
          <>
            <ul className="mt-4 divide-y divide-line">
              {lines.map((l) => (
                <li key={`${l.productId}:${l.variantId ?? 0}`} className="flex gap-3 py-3">
                  <ProductImage url={l.imageUrl} alt={l.name} className="h-20 w-16 shrink-0 border border-line" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium">{l.name}</p>
                    <p className="text-xs text-muted">{[l.size, l.color].filter(Boolean).join(" · ")} · Qty {l.qty}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatPrice(l.unitPrice * l.qty)}</p>
                </li>
              ))}
            </ul>

            <div className="mt-4">
              <label htmlFor="co-coupon" className="label">Coupon code</label>
              <div className="flex gap-2">
                <input id="co-coupon" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder={meta.couponCode || "Enter code"} maxLength={40} className="field" />
                <button type="button" className="btn btn-outline !px-4" onClick={() => updateCartMeta({ couponCode: couponInput.trim() })}>Apply</button>
              </div>
              {preview.couponCode && <p className="mt-2 text-sm text-success">Coupon {preview.couponCode} applied</p>}
              {preview.couponError && <p role="alert" className="field-error">{preview.couponError}</p>}
            </div>

            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(preview.subtotal)}</dd></div>
              {preview.discount > 0 && <div className="flex justify-between text-success"><dt>Discount</dt><dd>-{formatPrice(preview.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Delivery ({preview.zone?.name})</dt><dd>{preview.deliveryCharge === 0 ? "Free" : formatPrice(preview.deliveryCharge)}</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-green"><dt>Total</dt><dd data-testid="checkout-total">{formatPrice(preview.total)}</dd></div>
            </dl>
          </>
        )}
        <button type="submit" disabled={!canSubmit} className="btn btn-primary mt-6 w-full">{pending ? "Placing order…" : "Place Order"}</button>
        <p className="mt-3 text-center text-xs text-muted">Prices, stock and delivery are confirmed by our server when you place the order.</p>
        <Link href="/cart" className="mt-3 block text-center text-xs underline">Back to cart</Link>
      </aside>
    </form>
  );
}
