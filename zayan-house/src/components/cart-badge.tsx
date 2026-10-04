"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ShoppingBag } from "lucide-react";

const KEY = "zh_cart_v1";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("zh-cart-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("zh-cart-change", callback);
  };
}

function getSnapshot(): number {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return 0;
    const items = JSON.parse(raw) as { qty?: number }[];
    return items.reduce((sum, i) => sum + (Number.isInteger(i.qty) ? (i.qty as number) : 0), 0);
  } catch {
    return 0;
  }
}

export function CartBadge() {
  const count = useSyncExternalStore(subscribe, getSnapshot, () => 0);
  return (
    <Link href="/cart" aria-label={`Cart, ${count} items`} className="relative p-2 text-green hover:text-gold-dark">
      <ShoppingBag size={22} strokeWidth={1.5} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-green-dark">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
