"use server";

import { getSettings } from "@/lib/settings";
import { getCurrentCustomer } from "@/lib/auth";
import { checkoutSchema, zodFieldErrors } from "@/lib/validation";
import { createOrder, OrderError } from "@/lib/orders";
import { grantOrderAccess } from "@/lib/order-access";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> };

export async function placeOrderAction(input: unknown): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: zodFieldErrors(parsed.error), error: "Please check the highlighted fields." };

  const ip = await clientIp();
  const allowed = (await rateLimit(`order:ip:${ip}`, 10, 3600)) && (await rateLimit(`order:phone:${parsed.data.phone}`, 6, 3600));
  if (!allowed) return { ok: false, error: "Too many orders from this connection. Please wait a while or contact us on WhatsApp." };

  const settings = await getSettings();
  if (!settings.payment.codEnabled) return { ok: false, error: "Cash on Delivery is currently unavailable." };

  const customer = await getCurrentCustomer();
  try {
    const result = await createOrder(parsed.data, {
      userId: customer?.id ?? null,
      customerId: customer?.customerId ?? null,
      orderPrefix: (settings.orders.orderPrefix || "ZH").replace(/[^A-Za-z0-9]/g, "").slice(0, 6) || "ZH",
    });
    await grantOrderAccess(result.id);
    return { ok: true, orderNumber: result.orderNumber };
  } catch (error) {
    if (error instanceof OrderError) return { ok: false, error: error.message };
    console.error("placeOrder failed:", error);
    return { ok: false, error: "We could not place your order. Nothing was charged. Please try again." };
  }
}