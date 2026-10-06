"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Inventory", href: "/admin/inventory" },
  { label: "Coupons", href: "/admin/coupons" },
  { label: "Delivery", href: "/admin/delivery" },
  { label: "Pages", href: "/admin/pages" },
  { label: "Home Settings", href: "/admin/home" },
  { label: "Settings", href: "/admin/settings" },
];

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="space-y-1 px-3 pb-4 lg:pb-6">
      {NAV.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`block rounded-lg px-4 py-2.5 text-sm transition ${
              active
                ? "bg-gold font-semibold text-green-dark shadow-soft"
                : "text-cream/90 hover:bg-green-dark hover:text-cream"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}