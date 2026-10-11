"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Menu, X } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminLogo } from "@/components/admin/admin-logo";

export function AdminSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/admin" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <AdminLogo />
          <span className="leading-tight">
            <span className="block font-serif text-xl">Zayan Admin</span>
            <span className="block text-[0.65rem] uppercase tracking-[0.18em] text-gold-light/70">Control panel</span>
          </span>
        </Link>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-green-dark text-cream lg:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      <div className={`${open ? "block" : "hidden"} max-h-[75vh] flex-1 overflow-y-auto lg:flex lg:max-h-none lg:flex-col lg:justify-between`}>
        <AdminNav onNavigate={() => setOpen(false)} />
        <div className="px-3 pb-5">
          <Link href="/" target="_blank" className="flex items-center justify-between rounded-xl border border-cream/15 px-3.5 py-2.5 text-sm text-cream/80 transition hover:border-gold/60 hover:text-cream">
            View storefront <ExternalLink size={15} aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
