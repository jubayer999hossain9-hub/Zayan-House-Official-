"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, MessageCircle } from "lucide-react";

type Cat = { name: string; slug: string };

export function MobileMenu({ categories, loggedIn, whatsappHref }: { categories: Cat[]; loggedIn: boolean; whatsappHref: string | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="p-2 text-green lg:hidden">
        <Menu size={24} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-charcoal/50" onClick={close} />
          <nav className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto rounded-r-3xl bg-cream p-6 shadow-soft animate-fade-up">
            <button type="button" aria-label="Close menu" onClick={close} className="mb-4 self-end p-1 text-green">
              <X size={24} strokeWidth={1.5} />
            </button>
            <ul className="space-y-1 text-sm font-semibold uppercase tracking-[0.14em] text-green">
              {[["Home", "/"], ["Shop", "/shop"], ["New Arrivals", "/shop?new=1"], ["Best Sellers", "/shop?filter=bestseller"], ["About", "/about"], ["Contact", "/contact"]].map(([label, href]) => (
                <li key={href}><Link href={href} onClick={close} className="block py-3">{label}</Link></li>
              ))}
            </ul>
            <p className="mb-2 mt-6 border-t border-line pt-6 text-xs font-semibold uppercase tracking-[0.18em] text-muted">Collections</p>
            <ul className="space-y-1 text-[0.95rem] text-charcoal">
              {categories.map((c) => (
                <li key={c.slug}><Link href={`/category/${c.slug}`} onClick={close} className="block py-2">{c.name}</Link></li>
              ))}
            </ul>
            <div className="mt-6 space-y-3 border-t border-line pt-6">
              <Link href={loggedIn ? "/account" : "/login"} onClick={close} className="btn btn-outline w-full">
                {loggedIn ? "My Account" : "Login / Register"}
              </Link>
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full">
                  <MessageCircle size={15} /> Order on WhatsApp
                </a>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
