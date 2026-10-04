"use client";

import Link from "next/link";
import { useState } from "react";
import { saveCategory } from "@/app/actions/admin-site";
import { useFormAction } from "@/lib/use-form-action";
import { slugify } from "@/lib/slug";
import { ImageField } from "./image-field";

export type CategoryValues = { id?: number; name: string; slug: string; description: string; displayOrder: string; isActive: boolean; seoTitle: string; seoDescription: string; imageUrl: string };

export function CategoryForm({ initial }: { initial: CategoryValues }) {
  const { state, onSubmit, pending } = useFormAction(saveCategory);
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [touched, setTouched] = useState(!!initial.id);
  const err = (k: string) => state.fieldErrors?.[k];
  return (
    <form onSubmit={onSubmit} noValidate className="mb-8 grid gap-4 border border-line bg-cream p-5 sm:grid-cols-2">
      <h2 className="text-xl text-green sm:col-span-2">{initial.id ? "Edit category" : "Add category"}</h2>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {state.error && <p role="alert" className="border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger sm:col-span-2">{state.error}</p>}
      <div><label htmlFor="cat-name" className="label">Name</label><input id="cat-name" name="name" value={name} onChange={(e) => { setName(e.target.value); if (!touched) setSlug(slugify(e.target.value)); }} aria-invalid={err("name") ? "true" : undefined} className="field" />{err("name") && <p className="field-error">{err("name")}</p>}</div>
      <div><label htmlFor="cat-slug" className="label">Web address (slug)</label><input id="cat-slug" name="slug" value={slug} onChange={(e) => { setSlug(e.target.value); setTouched(true); }} aria-invalid={err("slug") ? "true" : undefined} className="field" />{err("slug") && <p className="field-error">{err("slug")}</p>}</div>
      <div className="sm:col-span-2"><label htmlFor="cat-desc" className="label">Description</label><input id="cat-desc" name="description" defaultValue={initial.description} className="field" /></div>
      <ImageField name="imageUrl" label="Category photo (optional)" initial={initial.imageUrl} error={err("imageUrl")} />
      <div><label htmlFor="cat-order" className="label">Display order</label><input id="cat-order" name="displayOrder" defaultValue={initial.displayOrder} inputMode="numeric" className="field" />{err("displayOrder") && <p className="field-error">{err("displayOrder")}</p>}<p className="mt-1 text-xs text-muted">Smaller numbers appear first.</p></div>
      <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="isActive" defaultChecked={initial.isActive} /> Visible in the shop</label>
      <div><label htmlFor="cat-seot" className="label">SEO title (optional)</label><input id="cat-seot" name="seoTitle" defaultValue={initial.seoTitle} className="field" /></div>
      <div><label htmlFor="cat-seod" className="label">SEO description (optional)</label><input id="cat-seod" name="seoDescription" defaultValue={initial.seoDescription} className="field" /></div>
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Saving…" : initial.id ? "Save category" : "Add category"}</button>
        {initial.id && <Link href="/admin/categories" className="btn btn-outline">Cancel</Link>}
      </div>
    </form>
  );
}
