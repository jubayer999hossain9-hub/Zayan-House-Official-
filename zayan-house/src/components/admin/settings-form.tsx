"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveSettings } from "@/app/actions/admin-site";
import { useFormAction } from "@/lib/use-form-action";
import { ImageField } from "./image-field";

export type SettingField = { name: string; label: string; kind?: "text" | "textarea" | "checkbox" | "number" | "image"; hint?: string; rows?: number };

export function SettingsForm({ group, title, description, fields, values }: {
  group: string; title: string; description?: string; fields: SettingField[]; values: Record<string, string | number | boolean>;
}) {
  const { state, onSubmit, pending } = useFormAction(saveSettings);
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 border border-line bg-cream p-5">
      <input type="hidden" name="group" value={group} />
      <div>
        <h2 className="text-xl text-green">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {state.ok && <p role="status" className="border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">Saved.</p>}
      {state.error && <p role="alert" className="border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{state.error}</p>}
      {fields.map((f) => {
        const err = state.fieldErrors?.[f.name];
        const id = `s-${group}-${f.name}`;
        if (f.kind === "image") {
          return <ImageField key={f.name} name={f.name} label={f.label} initial={String(values[f.name] ?? "")} error={err} hint={f.hint} />;
        }
        if (f.kind === "checkbox") {
          return <label key={f.name} className="flex items-center gap-2 text-sm"><input type="checkbox" name={f.name} defaultChecked={Boolean(values[f.name])} /> {f.label}</label>;
        }
        return (
          <div key={f.name}>
            <label htmlFor={id} className="label">{f.label}</label>
            {f.kind === "textarea" ? (
              <textarea id={id} name={f.name} defaultValue={String(values[f.name] ?? "")} rows={f.rows ?? 3} aria-invalid={err ? "true" : undefined} className="field" />
            ) : (
              <input id={id} name={f.name} defaultValue={String(values[f.name] ?? "")} inputMode={f.kind === "number" ? "numeric" : undefined} aria-invalid={err ? "true" : undefined} className="field" />
            )}
            {f.hint && !err && <p className="mt-1 text-xs text-muted">{f.hint}</p>}
            {err && <p className="field-error">{err}</p>}
          </div>
        );
      })}
      <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}

type Review = { name: string; city?: string; text: string };

export function TestimonialsForm({ initial }: { initial: Review[] }) {
  const { state, onSubmit, pending } = useFormAction(saveSettings);
  const [items, setItems] = useState<Review[]>(initial);
  const update = (i: number, patch: Partial<Review>) => setItems((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 border border-line bg-cream p-5">
      <input type="hidden" name="group" value="testimonials" />
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <div>
        <h2 className="text-xl text-green">Customer reviews on the homepage</h2>
        <p className="mt-1 text-sm text-muted">Up to 6. Only add real reviews from real customers. If the list is empty, the section is hidden.</p>
      </div>
      {state.ok && <p role="status" className="border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">Saved.</p>}
      {state.error && <p role="alert" className="border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{state.error}</p>}
      {items.map((r, i) => (
        <div key={i} className="grid gap-2 border border-line bg-ivory p-3 sm:grid-cols-[1fr_1fr_auto]">
          <input aria-label={`Review ${i + 1} name`} placeholder="Name" value={r.name} onChange={(e) => update(i, { name: e.target.value })} className="field" />
          <input aria-label={`Review ${i + 1} city`} placeholder="City (optional)" value={r.city ?? ""} onChange={(e) => update(i, { city: e.target.value })} className="field" />
          <button type="button" aria-label={`Remove review ${i + 1}`} onClick={() => setItems((x) => x.filter((_, j) => j !== i))} className="p-2 text-muted hover:text-danger"><Trash2 size={16} /></button>
          <textarea aria-label={`Review ${i + 1} text`} placeholder="What the customer said" value={r.text} onChange={(e) => update(i, { text: e.target.value })} rows={2} className="field sm:col-span-3" />
        </div>
      ))}
      <div className="flex gap-3">
        {items.length < 6 && <button type="button" onClick={() => setItems((x) => [...x, { name: "", city: "", text: "" }])} className="btn btn-outline !py-2"><Plus size={14} /> Add review</button>}
        <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Saving…" : "Save"}</button>
      </div>
    </form>
  );
}
