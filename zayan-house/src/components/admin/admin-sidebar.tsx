"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminLogo } from "@/components/admin/admin-logo";

export function AdminSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex items-center justify-between px-5 py-4">
        <Link href="/admin" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <AdminLogo />
          <span className="font-serif text-xl">Zayan Admin</span>
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
      <div className={`${open ? "block" : "hidden"} max-h-[75vh] overflow-y-auto lg:block lg:max-h-none`}>
        <AdminNav onNavigate={() => setOpen(false)} />
      </div>
    </>
  );
}