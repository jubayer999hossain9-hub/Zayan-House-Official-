"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart-client";

/** Add-to-cart for products that have no size/colour options. */
export function QuickAdd({ productId, disabled }: { productId: number; disabled?: boolean }) {
  const [added, setAdded] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        addToCart({ productId, variantId: null, qty: 1 });
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
      }}
      className="flex w-full items-center justify-center rounded-lg bg-green px-3 py-2.5 text-xs font-semibold tracking-wide text-cream transition-colors hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {disabled ? "Out of stock" : added ? "Added ✓" : "Add to Cart"}
    </button>
  );
}
