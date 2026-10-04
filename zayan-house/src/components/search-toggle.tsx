"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

export function SearchToggle() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close search" : "Search"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="p-2 text-green hover:text-gold-dark"
      >
        {open ? <X size={22} strokeWidth={1.5} /> : <Search size={22} strokeWidth={1.5} />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-40 border-b border-line bg-cream shadow-soft animate-fade-up">
          <form action="/shop" method="get" role="search" className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
            <input
              autoFocus
              type="search"
              name="q"
              maxLength={100}
              placeholder="Search by name, SKU or category"
              aria-label="Search products"
              className="field flex-1"
            />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
        </div>
      )}
    </>
  );
}
