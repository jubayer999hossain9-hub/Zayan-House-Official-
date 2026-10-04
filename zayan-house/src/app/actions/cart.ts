"use server";

import { z } from "zod";
import { previewCart, type CartPreview } from "@/lib/cart-resolve";
import { cartItemsSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const inputSchema = z.object({
  items: cartItemsSchema,
  couponCode: z.string().trim().max(40).nullable(),
  zoneSlug: z.string().trim().max(60).nullable(),
});

/** Prices the cart on the server. The browser only sends product ids and quantities. */
export async function previewCartAction(input: unknown): Promise<{ ok: true; preview: CartPreview } | { ok: false; error: string }> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Your cart could not be read. Please refresh the page." };
  const ip = await clientIp();
  if (!(await rateLimit(`cart-preview:${ip}`, 120, 60))) return { ok: false, error: "Too many requests. Please wait a moment." };
  try {
    return { ok: true, preview: await previewCart(parsed.data.items, parsed.data.couponCode, parsed.data.zoneSlug) };
  } catch (error) {
    console.error("previewCart failed:", error);
    return { ok: false, error: "We could not load your cart. Please try again." };
  }
}
