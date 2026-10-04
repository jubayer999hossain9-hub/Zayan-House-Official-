"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

type Cat = { name: string; slug: string };

const base = "relative inline-flex items-center gap-1 py-2 text-[0.8rem] font-medium tracking-wide transition-colors hover:text-gold-dark";
const underline = "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-gold";

export function DesktopNav({ categories }: { categories: Cat[] }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const isNew = sp.get("new") === "1" || sp.get("filter") === "new";
  const isBest = sp.get("filter") === "bestseller";
  const onShop = pathname === "/shop";

  const cls = (active: boolean) => `${base} ${active ? `text-gold-dark ${underline}` : "text-green"}`;
  const panel = "invisible absolute left-1/2 top-full z-50 w-60 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100";
  const item = "block px-5 py-2.5 text-sm text-charcoal hover:bg-ivory hover:text-green";

  return (
    <nav aria-label="Main" className="hidden items-center gap-7 xl:gap-9 lg:flex">
      <Link href="/" className={cls(pathname === "/")} aria-current={pathname === "/" ? "page" : undefined}>Home</Link>

      <div className="group relative">
        <button type="button" className={cls(pathname.startsWith("/category"))} aria-haspopup="true">
          Collections <ChevronDown size={14} />
        </button>
        <div className={panel}>
          <ul className="overflow-hidden rounded-2xl border border-line bg-cream py-2 shadow-soft">
            {categories.map((c) => (
              <li key={c.slug}><Link href={`/category/${c.slug}`} className={item}>{c.name}</Link></li>
            ))}
            <li className="mt-1 border-t border-line"><Link href="/shop" className={`${item} font-semibold text-green`}>View all products →</Link></li>
          </ul>
        </div>
      </div>

      <div className="group relative">
        <button type="button" className={cls(onShop && !isNew && !isBest)} aria-haspopup="true">
          Shop <ChevronDown size={14} />
        </button>
        <div className={panel}>
          <ul className="overflow-hidden rounded-2xl border border-line bg-cream py-2 shadow-soft">
            <li><Link href="/shop" className={item}>All Products</Link></li>
            <li><Link href="/shop?new=1" className={item}>New Arrivals</Link></li>
            <li><Link href="/shop?filter=bestseller" className={item}>Best Sellers</Link></li>
            <li><Link href="/shop?filter=featured" className={item}>Featured</Link></li>
          </ul>
        </div>
      </div>

      <Link href="/shop?new=1" className={cls(onShop && isNew)}>New Arrivals</Link>
      <Link href="/shop?filter=bestseller" className={cls(onShop && isBest)}>Best Sellers</Link>
      <Link href="/about" className={cls(pathname === "/about")}>About</Link>
      <Link href="/contact" className={cls(pathname === "/contact")}>Contact</Link>
    </nav>
  );
}
