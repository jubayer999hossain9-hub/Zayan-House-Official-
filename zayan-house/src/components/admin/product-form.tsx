"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveProduct } from "@/app/actions/admin-products";
import { useFormAction } from "@/lib/use-form-action";
import { slugify } from "@/lib/slug";

export type ProductValues = {
  id?: number; name: string; slug: string; sku: string; categoryId: number | null; shortDescription: string; description: string;
  productDetails: string; regularPrice: string; salePrice: string; costPrice: string; stock: string; status: "draft" | "active" | "archived";
  isFeatured: boolean; isBestseller: boolean; isNewArrival: boolean; seoTitle: string; seoDescription: string;
};
type VariantRow = { id?: number; size: string; color: string; colorHex: string; sku: string; price: string; stock: string; status: "active" | "inactive" };

export const EMPTY_PRODUCT: ProductValues = {
  name: "", slug: "", sku: "", categoryId: null, shortDescription: "", description: "", productDetails: "", regularPrice: "", salePrice: "",
  costPrice: "", stock: "0", status: "draft", isFeatured: false, isBestseller: false, isNewArrival: false, seoTitle: "", seoDescription: "",
};

export function ProductForm({ initial, variants: initialVariants, categories }: {
  initial: ProductValues; variants: VariantRow[]; categories: { id: number; name: string }[];
}) {
  const { state, onSubmit, pending } = useFormAction(saveProduct);
  const [v, setV] = useState(initial);
  const [rows, setRows] = useState<VariantRow[]>(initialVariants);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const err = (k: string) => state.fieldErrors?.[k];
  const set = <K extends keyof ProductValues>(k: K, val: ProductValues[K]) => setV((p) => ({ ...p, [k]: val }));

  const inp = (k: keyof ProductValues, label: string, opts: { type?: string; required?: boolean; hint?: string; inputMode?: "numeric" } = {}) => (
    <div>
      <label htmlFor={`pf-${k}`} className="label">{label}{opts.required && <span className="text-danger"> *</span>}</label>
      <input id={`pf-${k}`} name={k} value={String(v[k] ?? "")} inputMode={opts.inputMode} type={opts.type ?? "text"}
        onChange={(e) => {
          set(k, e.target.value as never);
          if (k === "name" && !slugTouched) set("slug", slugify(e.target.value));
          if (k === "slug") setSlugTouched(true);
        }}
        aria-invalid={err(k) ? "true" : undefined} className="field" />
      {opts.hint && !err(k) && <p className="mt-1 text-xs text-muted">{opts.hint}</p>}
      {err(k) && <p className="field-error">{err(k)}</p>}
    </div>
  );
  const updateRow = (i: number, patch: Partial<VariantRow>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const cell = "field !px-2 !py-1.5 !text-sm";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <input type="hidden" name="variants" value={JSON.stringify(rows.map((r) => ({ ...r, price: r.price === "" ? null : r.price })))} />
      {state.error && <p role="alert" className="border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{state.error}</p>}

      <section className="grid gap-4 border border-line bg-cream p-5 sm:grid-cols-2">
        <h2 className="text-xl text-green sm:col-span-2">Basic information</h2>
        <div className="sm:col-span-2">{inp("name", "Product name", { required: true })}</div>
        {inp("slug", "Web address (slug)", { hint: "Used in the product link. Created from the name automatically." })}
        {inp("sku", "SKU", { required: true, hint: "Your own unique product code." })}
        <div>
          <label htmlFor="pf-categoryId" className="label">Category</label>
          <select id="pf-categoryId" name="categoryId" value={v.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)} className="field">
            <option value="">No category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="pf-status" className="label">Status</label>
          <select id="pf-status" name="status" value={v.status} onChange={(e) => set("status", e.target.value as ProductValues["status"])} className="field">
            <option value="draft">Draft (hidden from shop)</option>
            <option value="active">Active (visible in shop)</option>
            <option value="archived">Archived (hidden)</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pf-shortDescription" className="label">Short description</label>
          <input id="pf-shortDescription" name="shortDescription" value={v.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} maxLength={300} className="field" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pf-description" className="label">Description</label>
          <textarea id="pf-description" name="description" value={v.description} onChange={(e) => set("description", e.target.value)} rows={5} className="field" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pf-productDetails" className="label">Product details (fabric, care, fit…)</label>
          <textarea id="pf-productDetails" name="productDetails" value={v.productDetails} onChange={(e) => set("productDetails", e.target.value)} rows={3} className="field" />
        </div>
      </section>

      <section className="grid gap-4 border border-line bg-cream p-5 sm:grid-cols-3">
        <h2 className="text-xl text-green sm:col-span-3">Pricing (in ৳)</h2>
        {inp("regularPrice", "Regular price", { required: true, inputMode: "numeric" })}
        {inp("salePrice", "Sale price (optional)", { inputMode: "numeric", hint: "Leave empty if not on sale." })}
        {inp("costPrice", "Cost price (optional)", { inputMode: "numeric", hint: "Only you can see this." })}
      </section>

      <section className="border border-line bg-cream p-5">
        <h2 className="text-xl text-green">Sizes, colours and stock</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Add one row per size/colour combination. Each row has its own SKU and stock. If this product has no sizes or colours, leave the table empty and use the stock box below.</p>
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wider text-muted">
                <th className="pb-2 pr-2">Size</th><th className="pb-2 pr-2">Colour</th><th className="pb-2 pr-2">Colour code</th><th className="pb-2 pr-2">Variant SKU</th>
                <th className="pb-2 pr-2">Price ৳ (optional)</th><th className="pb-2 pr-2">Stock</th><th className="pb-2 pr-2">Status</th><th />
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="align-top">
                    <td className="pr-2 pb-2"><input aria-label={`Row ${i + 1} size`} value={r.size} onChange={(e) => updateRow(i, { size: e.target.value })} className={cell} placeholder="M" /></td>
                    <td className="pr-2 pb-2"><input aria-label={`Row ${i + 1} colour`} value={r.color} onChange={(e) => updateRow(i, { color: e.target.value })} className={cell} placeholder="Emerald" /></td>
                    <td className="pr-2 pb-2"><input aria-label={`Row ${i + 1} colour code`} value={r.colorHex} onChange={(e) => updateRow(i, { colorHex: e.target.value })} className={cell} placeholder="#0F3D35" /></td>
                    <td className="pr-2 pb-2"><input aria-label={`Row ${i + 1} SKU`} value={r.sku} onChange={(e) => updateRow(i, { sku: e.target.value })} className={cell} /></td>
                    <td className="pr-2 pb-2"><input aria-label={`Row ${i + 1} price`} inputMode="numeric" value={r.price} onChange={(e) => updateRow(i, { price: e.target.value })} className={cell} /></td>
                    <td className="pr-2 pb-2"><input aria-label={`Row ${i + 1} stock`} inputMode="numeric" value={r.stock} onChange={(e) => updateRow(i, { stock: e.target.value })} className={`${cell} w-20`} /></td>
                    <td className="pr-2 pb-2">
                      <select aria-label={`Row ${i + 1} status`} value={r.status} onChange={(e) => updateRow(i, { status: e.target.value as VariantRow["status"] })} className={cell}>
                        <option value="active">Active</option><option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="pb-2"><button type="button" aria-label={`Remove row ${i + 1}`} onClick={() => setRows((x) => x.filter((_, j) => j !== i))} className="p-2 text-muted hover:text-danger"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button type="button" onClick={() => setRows((r) => [...r, { size: "", color: "", colorHex: "", sku: v.sku ? `${v.sku}-${r.length + 1}` : "", price: "", stock: "0", status: "active" }])} className="btn btn-outline mt-3 !py-2">
          <Plus size={14} /> Add variant
        </button>
        {rows.length === 0 && (
          <div className="mt-5 max-w-xs">
            {inp("stock", "Stock (when there are no variants)", { inputMode: "numeric" })}
          </div>
        )}
        {rows.length > 0 && <input type="hidden" name="stock" value="0" />}
      </section>

      <section className="border border-line bg-cream p-5">
        <h2 className="mb-3 text-xl text-green">Labels</h2>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="isFeatured" checked={v.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} /> Featured</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="isBestseller" checked={v.isBestseller} onChange={(e) => set("isBestseller", e.target.checked)} /> Bestseller</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="isNewArrival" checked={v.isNewArrival} onChange={(e) => set("isNewArrival", e.target.checked)} /> New arrival</label>
        </div>
      </section>

      <section className="grid gap-4 border border-line bg-cream p-5">
        <h2 className="text-xl text-green">Search engine (optional)</h2>
        {inp("seoTitle", "SEO title")}
        <div>
          <label htmlFor="pf-seoDescription" className="label">SEO description</label>
          <textarea id="pf-seoDescription" name="seoDescription" value={v.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} rows={2} className="field" />
        </div>
      </section>

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Saving…" : v.id ? "Save product" : "Create product"}</button>
        <Link href="/admin/products" className="btn btn-outline">Back to products</Link>
      </div>
    </form>
  );
}
