import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductImage } from "./product-image";

type Cat = { name: string; slug: string; imageUrl: string | null; description?: string | null };

/* Rotating colour palettes for categories that have no photo yet. */
const PALETTES = [
  { bg: "from-[#efe3c8] to-[#f8f0de]", text: "text-green", art: "#c8a96b" },
  { bg: "from-[#0f3d35] to-[#1a5a4e]", text: "text-cream", art: "#e6d3a3" },
  { bg: "from-[#f1e0bd] to-[#e3c98f]", text: "text-green", art: "#0f3d35" },
  { bg: "from-[#dfe7dc] to-[#f3f1e4]", text: "text-green", art: "#7c8a45" },
  { bg: "from-[#17584d] to-[#0b2f28]", text: "text-cream", art: "#c8a96b" },
  { bg: "from-[#f7efe0] to-[#ead9b6]", text: "text-green", art: "#a98a4d" },
];

function Art({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 120 120" className="absolute -right-3 bottom-0 h-full w-auto opacity-60" aria-hidden="true">
      <path d="M20 120 V60 a40 40 0 0 1 80 0 V120" fill="none" stroke={color} strokeWidth="2.5" />
      <path d="M32 120 V62 a28 28 0 0 1 56 0 V120" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="60" cy="52" r="9" fill={color} opacity="0.55" />
      <path d="M96 22 l2.5 6.5 6.5 2.5 -6.5 2.5 -2.5 6.5 -2.5 -6.5 -6.5 -2.5 6.5 -2.5 Z" fill={color} />
    </svg>
  );
}

/** Small horizontal card used in the "Shop by Category" row. */
export function CategoryCard({ cat, index }: { cat: Cat; index: number }) {
  const pal = PALETTES[index % PALETTES.length];
  return (
    <Link
      href={`/category/${cat.slug}`}
      className={`group relative flex h-28 w-[15.5rem] shrink-0 snap-start items-end overflow-hidden rounded-2xl bg-gradient-to-br p-4 shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-soft sm:h-32 md:w-auto ${pal.bg}`}
    >
      {cat.imageUrl ? (
        <>
          <ProductImage url={cat.imageUrl} alt="" className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105" />
          <span className="absolute inset-0 bg-gradient-to-r from-green-dark/80 via-green-dark/30 to-transparent" />
        </>
      ) : (
        <Art color={pal.art} />
      )}
      <span className={`relative flex flex-col gap-1.5 ${cat.imageUrl ? "text-cream" : pal.text}`}>
        <span className="font-serif text-xl font-semibold leading-tight sm:text-[1.35rem]">{cat.name}</span>
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden />
      </span>
    </Link>
  );
}

/** Tall feature tile used in "Featured Collections". */
export function CollectionTile({ cat, index, count }: { cat: Cat; index: number; count: number }) {
  const pal = PALETTES[(index + 1) % PALETTES.length];
  const dark = !cat.imageUrl && pal.text === "text-cream";
  const light = !!cat.imageUrl || dark;
  return (
    <div className={`group relative flex min-h-[19rem] flex-col justify-end overflow-hidden rounded-3xl bg-gradient-to-br p-6 shadow-card sm:min-h-[22rem] ${pal.bg}`}>
      {cat.imageUrl ? (
        <>
          <ProductImage url={cat.imageUrl} alt="" className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105" />
          <span className="absolute inset-0 bg-gradient-to-t from-green-dark/85 via-green-dark/25 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 opacity-90"><Art color={pal.art} /></div>
      )}
      <span className="absolute right-4 top-4 rounded-full bg-cream/95 px-3 py-1 text-[0.68rem] font-semibold text-green">
        {count} {count === 1 ? "Product" : "Products"}
      </span>
      <div className="relative">
        <h3 className={`font-serif text-3xl leading-tight ${light ? "text-cream" : "text-green"}`}>{cat.name}</h3>
        {cat.description && <p className={`mt-1 line-clamp-2 max-w-[16rem] text-sm ${light ? "text-cream/80" : "text-charcoal/70"}`}>{cat.description}</p>}
        <Link href={`/category/${cat.slug}`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-cream px-5 py-2.5 text-xs font-semibold tracking-wide text-green shadow-card transition hover:bg-gold-light">
          Explore <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
