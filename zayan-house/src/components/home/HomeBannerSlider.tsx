"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type SliderBanner = {
  id: number;
  imageUrl: string;
  heading: string;
  subtext: string;
  buttonText: string;
  buttonLink: string;
};

export function HomeBannerSlider({
  banners,
  intervalMs = 5000,
}: {
  banners: SliderBanner[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = banners.length;
  const current = count ? index % count : 0;

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => window.clearInterval(t);
  }, [count, paused, intervalMs]);

  if (!count) return null;
  const go = (step: number) => setIndex((current + step + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured banners"
      className="relative mx-auto w-full max-w-7xl px-3 pt-4 sm:px-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="relative aspect-[4/5] max-h-[620px] w-full overflow-hidden rounded-3xl bg-[#12392f] shadow-xl sm:aspect-[16/9] lg:aspect-[21/9]">
        {banners.map((b, i) => {
          const active = i === current;
          return (
            <div
              key={b.id}
              aria-hidden={!active}
              className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
                active ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.imageUrl}
                alt=""
                loading={i === 0 ? "eager" : "lazy"}
                className={`h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${
                  active ? "scale-100" : "scale-105"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent sm:bg-gradient-to-r sm:from-black/65 sm:via-black/25" />

              <div className="font-bn absolute inset-0 flex flex-col justify-end p-6 sm:justify-center sm:p-12 lg:p-16">
                <span className="mb-2 text-[11px] uppercase tracking-[0.3em] text-[#d8bd86]">
                  Zayan House
                </span>
                {b.heading && (
                  <h2 className="max-w-xl text-3xl font-medium leading-tight text-white sm:text-4xl lg:text-5xl">
                    {b.heading}
                  </h2>
                )}
                {b.subtext && (
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
                    {b.subtext}
                  </p>
                )}
                {b.buttonText && b.buttonLink && (
                  <Link
                    href={b.buttonLink}
                    tabIndex={active ? 0 : -1}
                    className="mt-5 inline-flex w-fit items-center rounded-full bg-[#b8975a] px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#1b1b1b] transition hover:bg-[#cdb07a]"
                  >
                    {b.buttonText}
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous banner"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/35 sm:flex"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              aria-label="Next banner"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/35 sm:flex"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  aria-label={`Show banner ${i + 1}`}
                  aria-current={i === current}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    i === current ? "w-7 bg-[#b8975a]" : "w-2 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
