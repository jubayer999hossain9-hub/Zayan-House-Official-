"use client";

import { useMemo, useSyncExternalStore } from "react";
import { MAX_QTY_PER_LINE, MAX_CART_LINES } from "./pricing-utils";

/** Guest-friendly cart kept in the browser. Prices are NEVER stored here, only ids and quantities. */
export type CartItem = { productId: number; variantId: number | null; qty: number };

const KEY = "zh_cart_v1";
const META_KEY = "zh_cart_meta_v1";
const EVENT = "zh-cart-change";

function read(key: string, fallback: string): string {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage may be blocked (private mode); the cart simply will not persist */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

function parseItems(raw: string): CartItem[] {
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const out: CartItem[] = [];
    for (const d of data) {
      if (
        d && Number.isInteger(d.productId) && d.productId > 0 &&
        (d.variantId === null || (Number.isInteger(d.variantId) && d.variantId > 0)) &&
        Number.isInteger(d.qty) && d.qty > 0
      ) {
        out.push({ productId: d.productId, variantId: d.variantId, qty: Math.min(d.qty, MAX_QTY_PER_LINE) });
      }
    }
    return out.slice(0, MAX_CART_LINES);
  } catch {
    return [];
  }
}

export function useCart() {
  const raw = useSyncExternalStore(subscribe, () => read(KEY, "[]"), () => "[]");
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const items = useMemo(() => parseItems(raw), [raw]);
  return { items, mounted };
}

export function saveCart(items: CartItem[]) {
  write(KEY, JSON.stringify(items));
}

export function getCartItems(): CartItem[] {
  return parseItems(read(KEY, "[]"));
}

export function addToCart(item: CartItem) {
  const items = getCartItems();
  const found = items.find((i) => i.productId === item.productId && i.variantId === item.variantId);
  if (found) found.qty = Math.min(found.qty + item.qty, MAX_QTY_PER_LINE);
  else items.push({ ...item, qty: Math.min(item.qty, MAX_QTY_PER_LINE) });
  saveCart(items);
}

export function setLineQty(productId: number, variantId: number | null, qty: number) {
  const items = getCartItems()
    .map((i) => (i.productId === productId && i.variantId === variantId ? { ...i, qty: Math.min(qty, MAX_QTY_PER_LINE) } : i))
    .filter((i) => i.qty > 0);
  saveCart(items);
}

export function removeLine(productId: number, variantId: number | null) {
  saveCart(getCartItems().filter((i) => !(i.productId === productId && i.variantId === variantId)));
}

export function clearCart() {
  saveCart([]);
}

/* ---- Cart extras: coupon code and delivery area chosen in the cart ---- */
export type CartMeta = { couponCode: string; zoneSlug: string };

function parseMeta(raw: string): CartMeta {
  try {
    const d = JSON.parse(raw);
    return {
      couponCode: typeof d?.couponCode === "string" ? d.couponCode.slice(0, 40) : "",
      zoneSlug: typeof d?.zoneSlug === "string" ? d.zoneSlug.slice(0, 60) : "",
    };
  } catch {
    return { couponCode: "", zoneSlug: "" };
  }
}

export function useCartMeta(): CartMeta {
  const raw = useSyncExternalStore(subscribe, () => read(META_KEY, "{}"), () => "{}");
  return useMemo(() => parseMeta(raw), [raw]);
}

export function updateCartMeta(patch: Partial<CartMeta>) {
  write(META_KEY, JSON.stringify({ ...parseMeta(read(META_KEY, "{}")), ...patch }));
}
