"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveBanner, deleteBanner, setBannerActive, moveBanner, saveVideo,
} from "@/app/actions/home-admin";
import { VIDEO_POSITIONS } from "@/lib/home/positions";

type Banner = {
  id: number; imageUrl: string; heading: string; subtext: string;
  buttonText: string; buttonLink: string; isActive: boolean;
};
type Video = {
  videoUrl: string; posterUrl: string; title: string; description: string;
  isActive: boolean; position: string;
};
type Result = { ok: true } | { ok: false; error: string };

const input =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#12392f] focus:ring-2 focus:ring-[#12392f]/15";
const btn =
  "rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-[#12392f] transition hover:bg-stone-50 disabled:opacity-40";
const primary =
  "rounded-full bg-[#12392f] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#1c5245] disabled:opacity-50";

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/home-media", { method: "POST", body: fd });
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed");
  return json.url;
}

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const run = (fn: () => Promise<Result>, onOk?: () => void) =>
    start(async () => {
      try {
        const r = await fn();
        setMessage(r.ok ? "Saved" : r.error);
        if (r.ok) {
          onOk?.();
          router.refresh();
        }
      } catch {
        setMessage("Something went wrong. Please try again.");
      }
    });
  return { pending, message, setMessage, run };
}

function ImagePicker({ value, onChange, label }: { value: string; onChange: (url: string) => void; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-stone-600">{label}</label>
      <div className="flex items-center gap-3">
        <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-stone-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value && <img src={value} alt="" className="h-full w-full object-cover" />}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          className="text-xs"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setError("");
            try {
              onChange(await uploadImage(file));
            } catch (err) {
              setError(err instanceof Error ? err.message : "Upload failed");
            } finally {
              setBusy(false);
              e.target.value = "";
            }
          }}
        />
      </div>
      <p className="mt-1 text-xs text-stone-500">{busy ? "Uploading…" : "JPG, PNG or WebP, up to 3 MB."}</p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function BannerCard({ banner, isFirst, isLast }: { banner: Banner | null; isFirst?: boolean; isLast?: boolean }) {
  const blank = { imageUrl: "", heading: "", subtext: "", buttonText: "", buttonLink: "" };
  const [form, setForm] = useState(banner ? {
    imageUrl: banner.imageUrl, heading: banner.heading, subtext: banner.subtext,
    buttonText: banner.buttonText, buttonLink: banner.buttonLink,
  } : blank);
  const { pending, message, run } = useRun();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      {banner && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={banner.isActive}
              disabled={pending}
              onChange={(e) => run(() => setBannerActive(banner.id, e.target.checked))}
            />
            {banner.isActive ? "Active (shown on the website)" : "Inactive (hidden)"}
          </label>
          <div className="flex gap-2">
            <button type="button" className={btn} disabled={pending || isFirst} onClick={() => run(() => moveBanner(banner.id, -1))}>↑ Move up</button>
            <button type="button" className={btn} disabled={pending || isLast} onClick={() => run(() => moveBanner(banner.id, 1))}>↓ Move down</button>
            <button
              type="button"
              className={`${btn} text-red-700`}
              disabled={pending}
              onClick={() => {
                if (window.confirm("Delete this banner?")) run(() => deleteBanner(banner.id));
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <ImagePicker label="Banner picture (wide, e.g. 2100 x 900)" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Heading</label>
          <input className={`${input} font-bn`} maxLength={160} value={form.heading} onChange={set("heading")} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Subtext</label>
          <input className={`${input} font-bn`} maxLength={300} value={form.subtext} onChange={set("subtext")} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Button text</label>
          <input className={`${input} font-bn`} maxLength={60} value={form.buttonText} onChange={set("buttonText")} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Button link (e.g. /shop)</label>
          <input className={input} maxLength={300} value={form.buttonLink} onChange={set("buttonLink")} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          className={primary}
          disabled={pending}
          onClick={() => run(() => saveBanner(banner?.id ?? null, form), () => { if (!banner) setForm(blank); })}
        >
          {pending ? "Saving…" : banner ? "Save changes" : "Add banner"}
        </button>
        {message && <span className="text-xs text-stone-600" role="status">{message}</span>}
      </div>
    </div>
  );
}

function VideoCard({ video }: { video: Video | null }) {
  const [form, setForm] = useState<Video>(
    video ?? { videoUrl: "", posterUrl: "", title: "", description: "", isActive: false, position: "after_categories" }
  );
  const { pending, message, run } = useRun();

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <label className="mb-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        Show the video section on the Home page
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-stone-600">Video link (direct .mp4 link or YouTube link, must start with https://)</label>
          <input className={input} maxLength={500} placeholder="https://…" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Title</label>
          <input className={`${input} font-bn`} maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Position on the Home page</label>
          <select className={input} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
            {VIDEO_POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-stone-600">Description</label>
          <textarea className={`${input} font-bn`} rows={3} maxLength={600} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <ImagePicker label="Poster picture (shown before the video loads)" value={form.posterUrl} onChange={(url) => setForm({ ...form, posterUrl: url })} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" className={primary} disabled={pending} onClick={() => run(() => saveVideo(form))}>
          {pending ? "Saving…" : "Save video settings"}
        </button>
        {message && <span className="text-xs text-stone-600" role="status">{message}</span>}
      </div>
    </div>
  );
}

export function HomeContentManager({ banners, video }: { banners: Banner[]; video: Video | null }) {
  return (
    <div className="mx-auto max-w-4xl space-y-10 p-4 sm:p-6">
      <section>
        <h1 className="text-2xl font-semibold text-[#12392f]">Home page banners</h1>
        <p className="mb-4 mt-1 text-sm text-stone-600">
          Active banners slide automatically, in this order. With no active banner, the old top banner is shown.
        </p>
        <div className="space-y-4">
          {banners.map((b, i) => (
            <BannerCard key={b.id} banner={b} isFirst={i === 0} isLast={i === banners.length - 1} />
          ))}
        </div>
        <h2 className="mb-3 mt-8 text-lg font-semibold text-[#12392f]">Add a new banner</h2>
        <BannerCard banner={null} />
      </section>

      <section>
        <h1 className="mb-4 text-2xl font-semibold text-[#12392f]">Showroom video</h1>
        <VideoCard video={video} />
      </section>
    </div>
  );
}
