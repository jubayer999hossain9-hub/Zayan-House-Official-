"use client";

import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";

export type ReviewItem = {
  text: string;
  name: string;
  city?: string | null;
};

function Star() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 1.6l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.4 4.9 17.3 6 11.6 1.7 7.6l5.8-.7z" />
    </svg>
  );
}

const ctrlBtn =
  "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-green/20 bg-white text-green transition-colors hover:border-green hover:bg-green hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export function Reviews({ testimonials }: { testimonials: ReviewItem[] }) {
  const swiperRef = useRef<SwiperType | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const count = testimonials.length;
  const canSlide = count > 3;
  const canLoop = count >= 6;

  const togglePlay = () => {
    const s = swiperRef.current;
    if (!s || !s.autoplay) return;
    if (isPlaying) s.autoplay.stop();
    else s.autoplay.start();
    setIsPlaying(!isPlaying);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white/70 to-transparent px-4 py-10 sm:px-8 sm:py-12">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-gold">Kind words</p>
            <h2 className="mt-2 font-serif text-3xl leading-tight text-green sm:text-4xl">
              What our customers say
            </h2>
          </div>

          {canSlide && (
            <div className="flex items-center gap-2.5">
              <button type="button" className={ctrlBtn} aria-label="Previous review" onClick={() => swiperRef.current?.slidePrev()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button type="button" className={ctrlBtn} aria-label="Next review" onClick={() => swiperRef.current?.slideNext()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
              <button type="button" className={ctrlBtn} aria-label={isPlaying ? "Pause autoplay" : "Play autoplay"} onClick={togglePlay}>
                {isPlaying ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 4.5v15a1 1 0 001.5.85l12-7.5a1 1 0 000-1.7l-12-7.5A1 1 0 007 4.5z" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Slider */}
        <Swiper
          modules={[Autoplay]}
          onSwiper={(s) => {
            swiperRef.current = s;
          }}
          onAutoplayTimeLeft={(_s, _t, progress) => {
            if (barRef.current) barRef.current.style.width = `${(1 - progress) * 100}%`;
          }}
          slidesPerView={1.08}
          spaceBetween={16}
          loop={canLoop}
          rewind={canSlide && !canLoop}
          grabCursor
          speed={700}
          autoplay={canSlide ? { delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
          breakpoints={{
            768: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 24 },
          }}
          style={{ overflow: "hidden", padding: "8px 4px 28px", margin: "0 -4px" }}
        >
          {testimonials.map((t, i) => (
            <SwiperSlide key={i} style={{ height: "auto", display: "flex" }}>
              <article
                className={`relative flex w-full flex-col overflow-hidden rounded-[22px] border border-green/10 px-7 pb-6 pt-9 shadow-card transition-all duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                  i % 2 === 0
                    ? "bg-gradient-to-br from-[#F4F8F7] to-[#EAF2EF]"
                    : "bg-gradient-to-br from-[#FDF8F2] to-[#F8EEE0]"
                }`}
              >
                <div className="absolute left-7 right-7 top-0 h-[3px] rounded-b bg-gradient-to-r from-gold via-[#E7CB8F] to-gold" />

                <svg
                  className="pointer-events-none absolute right-5 top-5 h-16 w-16 text-gold opacity-[0.16]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M9.6 5C5.9 6.3 3 9.7 3 14.3V19h6.4v-6H6.2c.2-2.4 1.5-4 3.4-4.8L9.6 5zm10 0c-3.7 1.3-6.6 4.7-6.6 9.3V19h6.4v-6h-3.2c.2-2.4 1.5-4 3.4-4.8L19.6 5z" />
                </svg>

                <div className="mb-4 flex gap-0.5 text-gold" aria-label="5 out of 5 stars">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <Star key={n} />
                  ))}
                </div>

                <p className="mb-7 flex-grow font-serif text-lg leading-[1.8] text-charcoal">{t.text}</p>

                <div className="flex items-center gap-4 border-t border-green/10 pt-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green to-green-dark text-lg font-bold text-[#F3DFB0] shadow-[0_0_0_3px_#FCFBF7,0_0_0_4.5px_#C89D4B]">
                    {t.name.trim().charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-green">{t.name}</h3>
                    {t.city && <p className="mt-0.5 text-[13px] text-charcoal/60">{t.city}</p>}
                  </div>
                </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>

        {canSlide && (
          <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-green/10">
            <div ref={barRef} className="h-full w-0 rounded-full bg-gradient-to-r from-gold to-green" />
          </div>
        )}
      </div>
    </section>
  );
}
