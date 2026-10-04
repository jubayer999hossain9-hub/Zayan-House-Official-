import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Full showcase picture at the top of the homepage.
 * Without a custom picture, the built-in Zayan House showcase is used (with a small and a large version for fast loading).
 */
export function HeroBanner({
  imageUrl, alt, heading, buttonLabel, buttonLink,
}: { imageUrl: string; alt: string; heading: string; buttonLabel: string; buttonLink: string }) {
  const custom = imageUrl.trim() !== "";
  return (
    <section aria-label="Welcome" className="bg-gradient-to-b from-[#fbf4e6] to-ivory px-3 pb-2 pt-4 sm:px-6 sm:pt-6">
      <h1 className="sr-only">{heading}</h1>
      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-cream shadow-soft sm:rounded-3xl">
        {custom ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={alt} width={1536} height={1024} fetchPriority="high" decoding="async" className="block h-auto w-full" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/hero/showcase-1536.jpg"
            srcSet="/hero/showcase-768.jpg 768w, /hero/showcase-1536.jpg 1536w"
            sizes="(min-width: 1200px) 1152px, 100vw"
            alt={alt}
            width={1536}
            height={1024}
            fetchPriority="high"
            decoding="async"
            className="block h-auto w-full"
          />
        )}
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-3 py-5 sm:py-7">
        <Link href={buttonLink || "/shop"} className="btn btn-primary">{buttonLabel || "Explore Collections"} <ArrowRight size={16} /></Link>
        <Link href="/shop" className="btn btn-outline bg-cream/60">Shop Now</Link>
      </div>
    </section>
  );
}
