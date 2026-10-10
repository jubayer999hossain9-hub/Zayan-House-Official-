"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { saveSettings } from "@/app/actions/admin-site";
import { useFormAction } from "@/lib/use-form-action";
import {
  BODY_FONTS, BUTTON_STYLES, CARD_STYLES, HEADING_FONTS, HEX, THEME_COLOR_FIELDS, THEME_PRESETS, ZAYAN_CLASSIC,
  googleFontsHref, type ThemeValues,
} from "@/lib/theme";

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a: string, b: string): number {
  if (!HEX.test(a) || !HEX.test(b)) return 21;
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

export function ThemeForm({ initial }: { initial: ThemeValues }) {
  const { state, onSubmit, pending } = useFormAction(saveSettings);
  const [v, setV] = useState<ThemeValues>({ ...ZAYAN_CLASSIC, ...initial });
  const set = (patch: Partial<ThemeValues>) => setV((x) => ({ ...x, ...patch }));

  const heading = HEADING_FONTS.find((f) => f.id === v.headingFont) ?? HEADING_FONTS[0];
  const body = BODY_FONTS.find((f) => f.id === v.bodyFont) ?? BODY_FONTS[0];
  const btn = BUTTON_STYLES.find((b) => b.id === v.buttonStyle) ?? BUTTON_STYLES[0];
  const card = CARD_STYLES.find((c) => c.id === v.cardStyle) ?? CARD_STYLES[0];
  const fontsHref = googleFontsHref(v);

  const col = (k: keyof ThemeValues) => (HEX.test(v[k]) ? v[k] : ZAYAN_CLASSIC[k as keyof typeof ZAYAN_CLASSIC]);

  const warnings: string[] = [];
  if (contrast(col("charcoal"), col("ivory")) < 4.5) warnings.push("Text colour is too close to the page background, so writing may be hard to read.");
  if (contrast(col("cream"), col("green")) < 4.5) warnings.push("Card background is too close to the main colour, so button writing may be hard to read.");
  if (contrast(col("goldDark"), col("ivory")) < 3) warnings.push("The italic accent words may be hard to see on the page background.");

  const previewVars = {
    "--pv-green": col("green"), "--pv-green-dark": col("greenDark"), "--pv-green-light": col("greenLight"),
    "--pv-gold": col("gold"), "--pv-gold-dark": col("goldDark"), "--pv-gold-light": col("goldLight"),
    "--pv-ivory": col("ivory"), "--pv-cream": col("cream"), "--pv-sand": col("sand"),
    "--pv-charcoal": col("charcoal"), "--pv-muted": col("muted"), "--pv-line": col("line"),
    "--pv-btn": btn.radius, "--pv-card": card.radius, "--pv-card-sm": card.small, "--pv-field": card.field,
    background: col("ivory"), color: col("charcoal"), fontFamily: body.css, border: `1px solid ${col("line")}`, borderRadius: card.radius, overflow: "hidden",
  } as React.CSSProperties;

  const pvBtn = (bg: string, fg: string, border?: string): React.CSSProperties => ({
    background: bg, color: fg, border: border ? `1px solid ${border}` : "1px solid transparent", borderRadius: "var(--pv-btn)",
    padding: "9px 20px", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "default",
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 border border-line bg-cream p-5">
      <input type="hidden" name="group" value="theme" />
      {Object.entries(v).map(([k, val]) => <input key={k} type="hidden" name={k} value={val} />)}
      {fontsHref && <link rel="stylesheet" href={fontsHref} />}

      <div>
        <h2 className="text-xl text-green">Website theme and design</h2>
        <p className="mt-1 text-sm text-muted">Change the colours, fonts and shapes of the whole shop website (the admin panel keeps its own look). Pick a ready style or change each colour yourself. The preview below updates as you choose, and nothing goes live until you press Save.</p>
      </div>

      {state.ok && <p role="status" className="border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">Saved. The new theme is now live on the website.</p>}
      {state.error && <p role="alert" className="border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
        <p role="alert" className="border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{Object.values(state.fieldErrors)[0]}</p>
      )}

      <div>
        <p className="label">Ready-made styles</p>
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((p) => (
            <button key={p.id} type="button" onClick={() => setV({ ...p.values })} className="flex items-center gap-2 border border-line bg-ivory px-3 py-2 text-sm hover:border-green" style={{ borderRadius: 10 }}>
              <span className="flex">
                {[p.values.green, p.values.gold, p.values.ivory].map((c, i) => <span key={i} style={{ background: c, width: 14, height: 14, borderRadius: 999, border: "1px solid rgba(0,0,0,.15)", marginLeft: i ? -4 : 0 }} />)}
              </span>
              {p.label}
            </button>
          ))}
          <button type="button" onClick={() => setV({ ...ZAYAN_CLASSIC })} className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted underline hover:text-green">
            <RotateCcw size={14} /> Reset to Zayan Classic
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-5">
          <div>
            <p className="label">Colours</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {THEME_COLOR_FIELDS.map((f) => (
                <div key={f.key} className="flex items-center gap-3 border border-line bg-ivory p-2.5" style={{ borderRadius: 10 }}>
                  <input type="color" aria-label={f.label} value={col(f.key)} onChange={(e) => set({ [f.key]: e.target.value })} className="h-10 w-10 shrink-0 cursor-pointer border-0 bg-transparent p-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight">{f.label}</p>
                    <p className="truncate text-xs text-muted">{f.hint}</p>
                  </div>
                  <input aria-label={`${f.label} code`} value={v[f.key]} onChange={(e) => set({ [f.key]: e.target.value.trim() })} maxLength={7} spellCheck={false} className="field !w-24 !px-2 !py-1.5 font-mono !text-xs" aria-invalid={!HEX.test(v[f.key]) ? "true" : undefined} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="th-heading" className="label">Heading font</label>
              <select id="th-heading" value={v.headingFont} onChange={(e) => set({ headingFont: e.target.value })} className="field">
                {HEADING_FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="th-body" className="label">Text font</label>
              <select id="th-body" value={v.bodyFont} onChange={(e) => set({ bodyFont: e.target.value })} className="field">
                {BODY_FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="th-btn" className="label">Button shape</label>
              <select id="th-btn" value={v.buttonStyle} onChange={(e) => set({ buttonStyle: e.target.value })} className="field">
                {BUTTON_STYLES.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="th-card" className="label">Boxes and fields</label>
              <select id="th-card" value={v.cardStyle} onChange={(e) => set({ cardStyle: e.target.value })} className="field">
                {CARD_STYLES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-muted">Bengali writing always uses the Kalpurush font, whichever fonts you choose.</p>
        </div>

        <div>
          <p className="label">Live preview</p>
          <div style={previewVars}>
            <div style={{ background: "var(--pv-green)", color: "var(--pv-cream)", fontSize: 11, padding: "6px 14px", letterSpacing: "0.06em" }}>Cash on Delivery available across Bangladesh</div>
            <div style={{ background: "var(--pv-ivory)", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--pv-line)" }}>
              <span style={{ fontFamily: heading.css, fontSize: 22, fontWeight: 600, color: "var(--pv-green)" }}>Zayan House</span>
              <span style={{ fontSize: 12, color: "var(--pv-muted)" }}>Shop · About · Contact</span>
            </div>
            <div style={{ padding: "22px 16px", background: "var(--pv-sand)" }}>
              <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--pv-gold-dark)", margin: 0 }}>Premium Women&apos;s Fashion</p>
              <p style={{ fontFamily: heading.css, fontSize: 32, lineHeight: 1.1, fontWeight: 600, color: "var(--pv-green)", margin: "6px 0 8px" }}>
                Elegance in Every <span style={{ fontStyle: "italic", fontWeight: 500, color: "var(--pv-gold-dark)" }}>Detail</span>
              </p>
              <p style={{ fontSize: 14, color: "var(--pv-muted)", margin: "0 0 14px" }}>Kurti, saree, three piece and party wear, crafted to be worn and loved.</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={pvBtn("var(--pv-green)", "var(--pv-cream)")}>Shop now</span>
                <span style={pvBtn("var(--pv-gold)", "var(--pv-green-dark)")}>New arrivals</span>
                <span style={pvBtn("transparent", "var(--pv-green)", "var(--pv-green)")}>Learn more</span>
              </div>
            </div>
            <div style={{ padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["Embroidered Kurti", "৳ 2,450"], ["Silk Saree", "৳ 6,800"]].map(([n, p]) => (
                <div key={n} style={{ background: "var(--pv-cream)", border: "1px solid var(--pv-line)", borderRadius: "var(--pv-card-sm)", overflow: "hidden" }}>
                  <div style={{ background: "var(--pv-gold-light)", height: 70 }} />
                  <div style={{ padding: 10 }}>
                    <p style={{ margin: 0, fontFamily: heading.css, fontSize: 16, fontWeight: 600, color: "var(--pv-charcoal)" }}>{n}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--pv-green-light)", fontWeight: 600 }}>{p}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: "0 14px 16px" }}>
              <div style={{ background: "var(--pv-cream)", border: "1px solid var(--pv-line)", borderRadius: "var(--pv-field)", padding: "10px 12px", fontSize: 13, color: "var(--pv-muted)" }}>Your phone number</div>
            </div>
          </div>
          {warnings.length > 0 && (
            <ul className="mt-3 space-y-1 border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">
              {warnings.map((w) => <li key={w}>{w}</li>)}
            </ul>
          )}
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Saving…" : "Save theme"}</button>
    </form>
  );
}
