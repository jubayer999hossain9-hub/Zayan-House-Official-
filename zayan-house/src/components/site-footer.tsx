import Link from "next/link";
import Image from "next/image";
import { getSettings } from "@/lib/settings";
import { getActiveCategories } from "@/lib/catalog-nav";
import { whatsappUrl } from "./whatsapp-link";

export async function SiteFooter() {
  const [settings, categories] = await Promise.all([getSettings(), getActiveCategories()]);
  const wa = whatsappUrl(settings.whatsapp.number, settings.whatsapp.message);
  const col = "text-sm text-cream/80 transition-colors hover:text-gold";
  const heading = "mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold";

  return (
    <footer className="bg-green text-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image unoptimized src="/logo.png" alt="Zayan House" width={96} height={96} className="h-20 w-auto rounded-2xl bg-ivory p-2.5" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream/75">
            {settings.general.tagline}. Refined women&apos;s fashion, made to be worn and loved.
          </p>
        </div>
        <div>
          <h3 className={heading}>Shop</h3>
          <ul className="space-y-2.5">
            <li><Link href="/shop" className={col}>All Products</Link></li>
            <li><Link href="/shop?new=1" className={col}>New Arrivals</Link></li>
            {categories.slice(0, 5).map((c) => (
              <li key={c.slug}><Link href={`/category/${c.slug}`} className={col}>{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className={heading}>Help</h3>
          <ul className="space-y-2.5">
            <li><Link href="/account" className={col}>My Account</Link></li>
            <li><Link href="/shipping" className={col}>Shipping &amp; Delivery</Link></li>
            <li><Link href="/returns" className={col}>Returns &amp; Refunds</Link></li>
            <li><Link href="/contact" className={col}>Contact Us</Link></li>
            <li><Link href="/about" className={col}>About Us</Link></li>
          </ul>
        </div>
        <div>
          <h3 className={heading}>Contact</h3>
          <ul className="space-y-2.5 text-sm text-cream/80">
            {settings.general.address && <li>{settings.general.address}</li>}
            {settings.general.contactPhone && <li>{settings.general.contactPhone}</li>}
            {settings.general.contactEmail && <li>{settings.general.contactEmail}</li>}
            {wa && (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                  Chat on WhatsApp
                </a>
              </li>
            )}
            {settings.social.facebook && (
              <li><a href={settings.social.facebook} target="_blank" rel="noopener noreferrer" className={col}>Facebook</a></li>
            )}
            {settings.social.instagram && (
              <li><a href={settings.social.instagram} target="_blank" rel="noopener noreferrer" className={col}>Instagram</a></li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/15">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-cream/60 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} {settings.general.siteName}. All rights reserved.</p>
          <p className="flex gap-5">
            <Link href="/privacy" className="hover:text-gold">Privacy</Link>
            <Link href="/terms" className="hover:text-gold">Terms</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
