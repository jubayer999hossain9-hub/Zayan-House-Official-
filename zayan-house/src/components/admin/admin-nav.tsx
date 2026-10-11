"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Tags, Boxes, ShoppingBag, Users, Ticket, Truck, FileText, Home, Settings } from "lucide-react";

const GROUPS = [
  { title: "Overview", items: [{ label: "Dashboard", href: "/admin", Icon: LayoutDashboard }] },
  {
    title: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", Icon: Package },
      { label: "Categories", href: "/admin/categories", Icon: Tags },
      { label: "Inventory", href: "/admin/inventory", Icon: Boxes },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Orders", href: "/admin/orders", Icon: ShoppingBag },
      { label: "Customers", href: "/admin/customers", Icon: Users },
      { label: "Coupons", href: "/admin/coupons", Icon: Ticket },
      { label: "Delivery", href: "/admin/delivery", Icon: Truck },
    ],
  },
  {
    title: "Website",
    items: [
      { label: "Pages", href: "/admin/pages", Icon: FileText },
      { label: "Home Settings", href: "/admin/home", Icon: Home },
      { label: "Settings", href: "/admin/settings", Icon: Settings },
    ],
  },
];

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="space-y-5 px-3 pb-4 lg:pb-6">
      {GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-1.5 px-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-gold-light/60">{group.title}</p>
          <div className="space-y-0.5">
            {group.items.map(({ label, href, Icon }) => {
              const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
                    active ? "bg-cream/12 font-medium text-cream" : "text-cream/75 hover:bg-cream/8 hover:text-cream"
                  }`}
                >
                  {active && <span aria-hidden className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-gold" />}
                  <Icon size={18} strokeWidth={1.75} aria-hidden className={active ? "text-gold" : "text-cream/60 transition group-hover:text-gold-light"} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
