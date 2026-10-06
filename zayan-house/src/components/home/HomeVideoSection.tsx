"use client";

import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

type Props = { videoUrl: string; posterUrl: string; title: string; description: string };

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}

export function HomeVideoSection({ videoUrl, posterUrl, title, description }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const yt = youtubeId(videoUrl);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="grid items-center gap-8 lg:grid-cols-[3fr_2fr] lg:gap-12">
        <div className="relative aspect-video overflow-hidden rounded-3xl bg-[#12392f] shadow-2xl ring-1 ring-[#b8975a]/30">
          {yt ? (
            <iframe
              title={title || "Zayan House showroom video"}
              src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&mute=1&loop=1&playlist=${yt}&controls=0&modestbranding=1&playsinline=1&rel=0`}
              allow="autoplay; encrypted-media; picture-in-picture"
              loading="lazy"
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                poster={posterUrl || undefined}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <button
                type="button"
                aria-label={muted ? "Turn sound on" : "Turn sound off"}
                onClick={() => {
                  const next = !muted;
                  setMuted(next);
                  if (videoRef.current) videoRef.current.muted = next;
                }}
                className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55"
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </>
          )}
        </div>

        <div className="font-bn">
          <span className="text-[11px] uppercase tracking-[0.3em] text-[#b8975a]">Our Showroom</span>
          {title && (
            <h2 className="mt-2 text-3xl font-medium leading-tight text-[#12392f] sm:text-4xl">{title}</h2>
          )}
          <span className="mt-4 block h-px w-16 bg-[#b8975a]" />
          {description && (
            <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-stone-700">{description}</p>
          )}
        </div>
      </div>
    </section>
  );
}
