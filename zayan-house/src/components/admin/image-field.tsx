"use client";

import { useState } from "react";
import { ProductImage } from "@/components/product-image";

/** A text field that also lets the admin upload a photo; the field holds the resulting link. */
export function ImageField({ name, label, initial, error, hint }: { name: string; label: string; initial: string; error?: string; hint?: string }) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMsg(data.error ?? "Upload failed.");
      else setValue(data.url);
    } catch {
      setMsg("Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sm:col-span-2">
      <label htmlFor={`img-${name}`} className="label">{label}</label>
      <div className="flex flex-wrap items-center gap-3">
        {value && <ProductImage url={value} alt="" className="h-20 w-28 shrink-0 rounded-lg border border-line" />}
        <div className="min-w-0 flex-1 space-y-2">
          <input id={`img-${name}`} name={name} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Upload a photo, or paste an https:// link" className="field" aria-invalid={error ? "true" : undefined} />
          <div className="flex flex-wrap items-center gap-3">
            <label className="btn btn-outline cursor-pointer !px-4 !py-2 !text-[0.65rem]">
              {busy ? "Uploading…" : "Upload photo"}
              <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} className="sr-only" aria-label={`Upload ${label}`} />
            </label>
            {value && <button type="button" onClick={() => setValue("")} className="text-xs font-semibold uppercase tracking-wider text-danger underline">Remove</button>}
          </div>
        </div>
      </div>
      {msg && <p role="alert" className="field-error">{msg}</p>}
      {error && <p className="field-error">{error}</p>}
      <p className="mt-1 text-xs text-muted">{hint ?? "Shown on the homepage category cards. Wide photos (4:3) look best. Without a photo, a decorative card is used."}</p>
    </div>
  );
}
