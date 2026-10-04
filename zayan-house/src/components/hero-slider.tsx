"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export type HeroSlide = { eyebrow: string; title: string; accent: string; text: string; button: string; link: string };

export function HeroSlider({ slides, scene }: { slides: HeroSlide[]; scene: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 7000);
    return () => clearInterval(t);
  }, [paused, count]);

  const s = slides[index];
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-[#fbf4e6] via-[#f6ecd7] to-[#eddcba]"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative mx-auto grid min-h-[34rem] max-w-7xl items-center px-4 sm:px-6 md:min-h-[28rem] md:grid-cols-[1fr_1.1fr] lg:min-h-[32rem]">
        <div className="relative z-10 pb-4 pt-10 md:max-w-lg md:py-16 lg:ml-6" key={index} aria-live="polite">
          <p className="animate-fade-up flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-gold-dark">
            <span className="h-px w-8 bg-gold-dark" aria-hidden /> {s.eyebrow}
          </p>
          <h1 className="animate-fade-up mt-4 text-5xl leading-[1.04] text-green sm:text-6xl lg:text-7xl">
            {s.title} {s.accent && <span className="accent-italic">{s.accent}</span>}
          </h1>
          <p className="animate-fade-up mt-5 max-w-md text-[0.95rem] leading-relaxed text-charcoal/75">{s.text}</p>
          <div className="animate-fade-up mt-7 flex flex-wrap gap-3">
            <Link href={s.link} className="btn btn-primary">{s.button} <ArrowRight size={16} /></Link>
            <Link href="/shop" className="btn btn-outline bg-cream/60">Shop Now</Link>
          </div>
        </div>
        <div className="pointer-events-none relative -mx-4 h-64 sm:mx-0 sm:h-80 md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[58%]">
          {scene}
        </div>
      </div>

      {count > 1 && (
        <>
          <button type="button" aria-label="Previous slide" onClick={() => go(index - 1)} className="absolute left-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream/95 text-green shadow-soft transition hover:bg-gold-light md:flex">
            <ChevronLeft size={20} />
          </button>
          <button type="button" aria-label="Next slide" onClick={() => go(index + 1)} className="absolute right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream/95 text-green shadow-soft transition hover:bg-gold-light md:flex">
            <ChevronRight size={20} />
          </button>
          <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button key={i} type="button" aria-label={`Go to slide ${i + 1}`} aria-current={i === index} onClick={() => go(i)} className={`h-1.5 rounded-full transition-all ${i === index ? "w-8 bg-green" : "w-4 bg-green/25 hover:bg-green/50"}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
