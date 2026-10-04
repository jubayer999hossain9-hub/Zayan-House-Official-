"use client";

import Link from "next/link";
import { useState } from "react";
import { saveCoupon } from "@/app/actions/admin-coupons";
import { useFormAction } from "@/lib/use-form-action";

export type CouponValues = {
  id?: number; code: string; description: string; discountType: "percent" | "fixed"; discountValue: string; minOrderAmount: string;
  maxDiscountAmount: string; startsAt: string; expiresAt: string; isActive: boolean; usageLimit: string; perCustomerLimit: string;
};

export function CouponForm({ initial }: { initial: CouponValues }) {
  const { state, onSubmit, pending } = useFormAction(saveCoupon);
  const [type, setType] = useState(initial.discountType);
  const err = (k: string) => state.fieldErrors?.[k];
  const f = (name: keyof CouponValues, label: string, opts: { type?: string; hint?: string; inputMode?: "numeric" } = {}) => (
    <div>
      <label htmlFor={`cf-${name}`} className="label">{label}</label>
      <input id={`cf-${name}`} name={name} defaultValue={String(initial[name] ?? "")} type={opts.type ?? "text"} inputMode={opts.inputMode} aria-invalid={err(name) ? "true" : undefined} className="field" />
      {opts.hint && !err(name) && <p className="mt-1 text-xs text-muted">{opts.hint}</p>}
      {err(name) && <p className="field-error">{err(name)}</p>}
    </div>
  );
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 border border-line bg-cream p-5 sm:grid-cols-2">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {state.error && <p role="alert" className="border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger sm:col-span-2">{state.error}</p>}
      {f("code", "Coupon code", { hint: "Customers type this at checkout. Letters and numbers only." })}
      {f("description", "Description (private note)")}
      <div>
        <label htmlFor="cf-discountType" className="label">Discount type</label>
        <select id="cf-discountType" name="discountType" value={type} onChange={(e) => setType(e.target.value as "percent" | "fixed")} className="field">
          <option value="percent">Percentage (%)</option><option value="fixed">Fixed amount (৳)</option>
        </select>
      </div>
      {f("discountValue", type === "percent" ? "Discount (%)" : "Discount (৳)", { inputMode: "numeric" })}
      {f("minOrderAmount", "Minimum order amount (৳)", { inputMode: "numeric", hint: "Leave empty for no minimum." })}
      {type === "percent" && f("maxDiscountAmount", "Maximum discount (৳)", { inputMode: "numeric", hint: "Caps a percentage discount. Optional." })}
      {f("startsAt", "Starts on", { type: "datetime-local", hint: "Optional." })}
      {f("expiresAt", "Expires on", { type: "datetime-local", hint: "Optional." })}
      {f("usageLimit", "Total usage limit", { inputMode: "numeric", hint: "How many times it can be used in total. Optional." })}
      {f("perCustomerLimit", "Uses per customer", { inputMode: "numeric", hint: "Matched by phone number. Optional." })}
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="isActive" defaultChecked={initial.isActive} /> Active (customers can use it)</label>
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Saving…" : initial.id ? "Save coupon" : "Create coupon"}</button>
        <Link href="/admin/coupons" className="btn btn-outline">Cancel</Link>
      </div>
    </form>
  );
}
