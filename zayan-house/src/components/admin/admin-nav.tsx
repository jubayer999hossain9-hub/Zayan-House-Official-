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
  { label: "Home Settings", href: "/admin/home" }, // নতুন পেজের লিংক এখানে যুক্ত করা হয়েছে
  { label: "Settings", href: "/admin/settings" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:pb-0">
      {NAV.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`block whitespace-nowrap rounded-sm px-3 py-2 text-sm ${active ? "bg-gold text-green-dark font-semibold" : "hover:bg-green-dark"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}