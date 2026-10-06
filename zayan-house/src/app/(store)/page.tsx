import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getActiveCategories, getCategoryCounts } from "@/lib/catalog-nav";
import { getSettings } from "@/lib/settings";
import { listProducts } from "@/lib/catalog";
import { getTestimonials } from "@/lib/testimonials";
import { SITE_URL } from "@/lib/site";
import { ProductGrid, ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { NewsletterForm } from "@/components/newsletter-form";
import { HeroSlider, type HeroSlide } from "@/components/hero-slider";
import { ArchScene } from "@/components/arch-scene";
import { HeroBanner } from "@/components/hero-banner";
import { CategoryCard, CollectionTile } from "@/components/category-card";

// ব্যানার ও ভিডিও কম্পোনেন্ট ইম্পোর্ট করা হলো
import { HomeBanners } from "@/components/home/HomeBanners";
import { HomeVideoSlot } from "@/components/home/HomeVideoSlot";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [categories, counts, settings, featured, newArrivals, bestsellers, testimonials] = await Promise.all([
    getActiveCategories(),
    getCategoryCounts(),
    getSettings(),
    listProducts({ filter: "featured", pageSize: 4, sort: "featured" }),
    listProducts({ filter: "new", pageSize: 4, sort: "newest" }),
    listProducts({ filter: "bestseller", pageSize: 4, sort: "best_selling" }),
    getTestimonials(),
  ]);

  const h = settings.hero;
  const slides: HeroSlide[] = ([
    { eyebrow: h.s1Eyebrow, title: h.s1Title, accent: h.s1Accent, text: h.s1Text, button: h.s1Button, link: h.s1Link },
    { eyebrow: h.s2Eyebrow, title: h.s2Title, accent: h.s2Accent, text: h.s2Text, button: h.s2Button, link: h.s2Link },
    { eyebrow: h.s3Eyebrow, title: h.s3Title, accent: h.s3Accent, text: h.s3Text, button: h.s3Button, link: h.s3Link },
  ] as HeroSlide[]).filter((s) => s.title.trim() !== "").map((s) => ({ ...s, link: s.link || "/shop", button: s.button || "Shop Now" }));

  const collections = categories
    .map((c, i) => ({ c, i, n: counts.get(c.id) ?? 0 }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 4);

  const promo = settings.promo;
  const showPromo = promo.enabled && promo.title.trim() !== "";

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.general.siteName,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [settings.social.facebook, settings.social.instagram].filter(Boolean),
  };

  const promoBanner = (
    <div className="relative flex h-full min-h-[18rem] overflow-hidden rounded-3xl bg-gradient-to-br from-green to-green-dark text-cream shadow-soft">
      <div className="relative z-10 flex w-3/5 flex-col justify-center p-7 sm:p-9">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-gold">{promo.eyebrow}</p>
        <h3 className="mt-2 font-serif text-3xl leading-tight sm:text-4xl">{promo.title}</h3>
        {promo.text && <p className="mt-2 text-sm text-cream/80">{promo.text}</p>}
        <Link href={promo.link || "/shop"} className="btn btn-gold mt-5 self-start !px-6 !py-2.5">
          {promo.button || "Shop Now"} <ArrowRight size={14} />
        </Link>
      </div>
      <ArchScene variant="compact" className="absolute -right-6 bottom-0 h-[92%] w-[62%]" />
    </div>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd).replace(/</g, "\\u003c") }} />

      {/* টপ ব্যানার এবং স্লাইডার একসাথে */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        {settings.banner.enabled && (
          <HeroBanner
            imageUrl={settings.banner.imageUrl}
            alt={settings.banner.alt || settings.general.siteName}
            heading={`${settings.general.siteName}: ${settings.general.tagline}`}
            buttonLabel={settings.hero.s1Button}
            buttonLink={settings.hero.s1Link}
          />
        )}
        <HeroSlider slides={slides} scene={<ArchScene className="h-full w-full" />} />
      </section>
      
      {/* ভিডিও স্লট */}
      <HomeVideoSlot position="after_banner" />

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
          <SectionHeading title="Shop by Category" subtitle="Explore our wide range of collections" href="/shop" linkLabel="View All Categories" />
          <ul className="no-scrollbar -mx-4 flex scroll-pl-4 snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-6 lg:gap-4">
            {categories.map((c, i) => (
              <li key={c.slug} className="md:contents"><CategoryCard cat={c} index={i} /></li>
            ))}
          </ul>
        </section>
      )}
      <HomeVideoSlot position="after_categories" />

      {collections.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
          <SectionHeading title="Featured Collections" subtitle="Handpicked collections for you" href="/shop" linkLabel="View All Collections" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {collections.map(({ c, i, n }) => (
              <li key={c.slug}><CollectionTile cat={c} index={i} count={n} /></li>
            ))}
          </ul>
        </section>
      )}
      <HomeVideoSlot position="after_collections" />

      {(newArrivals.items.length > 0 || showPromo) && (
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
          <div className={`grid gap-6 ${showPromo && newArrivals.items.length > 0 ? "lg:grid-cols-[1.4fr_1fr]" : ""}`}>
            {newArrivals.items.length > 0 && (
              <div>
                <SectionHeading title="New Arrivals" subtitle="Fresh styles, just for you" href="/shop?new=1" linkLabel="View All" />
                {showPromo ? (
                  <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                    {newArrivals.items.map((p) => (
                      <li key={p.id}><ProductCard product={p} /></li>
                    ))}
                  </ul>
                ) : (
                  <ProductGrid products={newArrivals.items} />
                )}
              </div>
            )}
            {showPromo && <div className="lg:pt-[4.6rem]">{promoBanner}</div>}
          </div>
        </section>
      )}
      <HomeVideoSlot position="after_new_arrivals" />

      {featured.items.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
          <SectionHeading eyebrow="Handpicked" title="Featured Products" href="/shop?filter=featured" />
          <ProductGrid products={featured.items} />
        </section>
      )}
      <HomeVideoSlot position="after_featured" />

      {bestsellers.items.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
          <SectionHeading eyebrow="Loved by many" title="Best Sellers" href="/shop?filter=bestseller" />
          <ProductGrid products={bestsellers.items} />
        </section>
      )}
      <HomeVideoSlot position="after_best_sellers" />

      {/* Brand story */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-green px-6 py-14 text-center text-cream sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-gold/10" aria-hidden />
          <div className="pointer-events-none absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-gold/10" aria-hidden />
          <div className="relative mx-auto max-w-2xl">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-gold">Our Story</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">Modest elegance, <span className="accent-italic !text-gold">made modern</span></h2>
            <p className="mt-5 leading-relaxed text-cream/80">
              {settings.general.siteName} was created for women who value refined design and comfort. Every piece is chosen for its fabric, its finish and the way it makes you feel: quietly confident, beautifully put together.
            </p>
            <Link href="/about" className="btn btn-gold mt-7">Read our story</Link>
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
          <SectionHeading eyebrow="Kind words" title="What our customers say" />
          <ul className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <li key={i} className="rounded-2xl bg-white p-6 shadow-card">
                <p className="font-serif text-xl leading-relaxed text-charcoal">&ldquo;{t.text}&rdquo;</p>
                <p className="mt-4 text-sm font-semibold text-green">{t.name}{t.city ? `, ${t.city}` : ""}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Newsletter */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="rounded-3xl bg-sand px-6 py-12 text-center">
          <h2 className="text-3xl text-green sm:text-4xl">Join the Zayan House list</h2>
          <p className="mb-6 mt-2 text-sm text-charcoal/70">New arrivals and offers, straight to your inbox.</p>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}