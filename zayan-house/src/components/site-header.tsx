import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Truck, User, MessageCircle } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "./social-icons";
import { getSettings } from "@/lib/settings";
import { getActiveCategories } from "@/lib/catalog-nav";
import { getCurrentCustomer } from "@/lib/auth";
import { CartBadge } from "./cart-badge";
import { SearchToggle } from "./search-toggle";
import { MobileMenu } from "./mobile-menu";
import { DesktopNav } from "./desktop-nav";
import { whatsappUrl } from "./whatsapp-link";

export async function SiteHeader() {
  const [settings, categories, customer] = await Promise.all([
    getSettings(),
    getActiveCategories(),
    getCurrentCustomer().catch(() => null),
  ]);
  const wa = whatsappUrl(settings.whatsapp.number, settings.whatsapp.message);
  const social = [
    settings.social.facebook && { href: settings.social.facebook, label: "Facebook", Icon: FacebookIcon },
    settings.social.instagram && { href: settings.social.instagram, label: "Instagram", Icon: InstagramIcon },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof FacebookIcon }[];

  return (
    <header className="sticky top-0 z-40 bg-ivory shadow-[0_1px_0_var(--color-line)]">
      {/* top bar */}
      <div className="bg-green text-cream">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between gap-4 px-4 text-[0.68rem] tracking-[0.06em] sm:px-6 sm:text-xs">
          <p className="flex min-w-0 items-center gap-2">
            {settings.announcement.enabled && settings.announcement.text ? (
              <>
                <Truck size={14} className="shrink-0 text-gold" aria-hidden />
                <span className="truncate">{settings.announcement.text}</span>
              </>
            ) : null}
          </p>
          <p className="hidden items-center gap-3 text-cream/80 lg:flex">
            <span>Cash on Delivery</span><span className="text-gold" aria-hidden>|</span>
            <span>Delivery across Bangladesh</span><span className="text-gold" aria-hidden>|</span>
            <span>WhatsApp support</span>
          </p>
          <div className="flex items-center gap-3">
            {social.map(({ href, label, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="text-cream/85 hover:text-gold"><Icon size={14} /></a>
            ))}
          </div>
        </div>
      </div>

      {/* main bar */}
      <div className="relative mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-[4.75rem]">
        <div className="flex items-center lg:hidden">
          <MobileMenu categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} loggedIn={!!customer} whatsappHref={wa} />
        </div>

        <Link href="/" aria-label="Zayan House home" className="flex items-center max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2">
          <Image unoptimized src="/logo.png" alt="Zayan House" width={64} height={64} priority className="h-11 w-auto lg:h-[3.4rem]" />
        </Link>

        <Suspense fallback={<div className="hidden lg:block" />}>
          <DesktopNav categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} />
        </Suspense>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <SearchToggle />
          <Link href={customer ? "/account" : "/login"} aria-label={customer ? "My account" : "Login"} className="hidden p-2 text-green hover:text-gold-dark lg:block">
            <User size={22} strokeWidth={1.5} />
          </Link>
          <CartBadge />
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-primary ml-3 hidden !px-5 !py-3 !text-[0.7rem] xl:inline-flex">
              <MessageCircle size={15} /> Order on WhatsApp
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
