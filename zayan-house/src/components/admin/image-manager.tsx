"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Star, Trash2 } from "lucide-react";
import { addProductImage, removeProductImage, moveProductImage } from "@/app/actions/admin-products";
import { ProductImage } from "@/components/product-image";

type Img = { id: number; url: string };

export function ImageManager({ productId, images, productName }: { productId: number; images: Img[]; productName: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState("");

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try { await fn(); router.refresh(); } catch { setError("Something went wrong. Please try again."); } finally { setBusy(false); }
  }

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    await run(async () => {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setError(`${file.name}: ${data.error ?? "Upload failed."}`); return; }
        const added = await addProductImage(productId, data.url);
        if (!added.ok) { setError(added.error ?? "Could not add the image."); return; }
      }
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <section className="border border-line bg-cream p-5">
      <h2 className="text-xl text-green">Photos</h2>
      <p className="mb-4 mt-1 text-sm text-muted">The first photo is the main one shown in the shop. JPG, PNG or WebP, up to 3 MB each. Tall (3:4) photos look best.</p>
      {error && <p role="alert" className="mb-3 border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>}
      {images.length === 0 ? (
        <p className="mb-4 border border-dashed border-line p-6 text-center text-sm text-muted">No photos yet. The shop shows a placeholder until you add one.</p>
      ) : (
        <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.id} className="border border-line bg-ivory p-2">
              <div className="relative">
                <ProductImage url={img.url} alt={productName} className="aspect-[3/4] w-full" />
                {i === 0 && <span className="absolute left-1 top-1 bg-gold px-2 py-0.5 text-[0.6rem] font-bold uppercase text-green-dark">Main</span>}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <button type="button" disabled={busy || i === 0} aria-label="Make main photo" title="Make main" onClick={() => run(() => moveProductImage(img.id, "first"))} className="p-1.5 text-green disabled:opacity-30"><Star size={16} /></button>
                <button type="button" disabled={busy || i === 0} aria-label="Move earlier" onClick={() => run(() => moveProductImage(img.id, "up"))} className="p-1.5 text-green disabled:opacity-30"><ArrowUp size={16} /></button>
                <button type="button" disabled={busy || i === images.length - 1} aria-label="Move later" onClick={() => run(() => moveProductImage(img.id, "down"))} className="p-1.5 text-green disabled:opacity-30"><ArrowDown size={16} /></button>
                <button type="button" disabled={busy} aria-label="Delete photo" onClick={() => { if (window.confirm("Delete this photo?")) run(() => removeProductImage(img.id)); }} className="p-1.5 text-danger disabled:opacity-30"><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <label className="btn btn-primary cursor-pointer">
          {busy ? "Working…" : "Upload photos"}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={(e) => upload(e.target.files)} className="sr-only" aria-label="Upload photos" />
        </label>
        <div className="flex min-w-0 flex-1 gap-2">
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="…or paste an https:// image link" aria-label="Image link" className="field min-w-0 flex-1" />
          <button type="button" disabled={busy || !link.trim()} className="btn btn-outline !px-4" onClick={() => run(async () => {
            const r = await addProductImage(productId, link.trim());
            if (!r.ok) setError(r.error ?? "Could not add the image."); else setLink("");
          })}>Add</button>
        </div>
      </div>
    </section>
  );
}
