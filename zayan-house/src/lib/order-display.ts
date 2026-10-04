export const ORDER_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", processing: "Processing", shipped: "Shipped",
  delivered: "Delivered", cancelled: "Cancelled",
  paid: "Paid", failed: "Failed", refunded: "Refunded",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cod: "Cash on Delivery", bkash: "bKash", nagad: "Nagad", card: "Card",
};

export function formatDate(d: Date, withTime = false): string {
  return d.toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka",
    ...(withTime ? { hour: "numeric", minute: "2-digit", hour12: true } : {}),
  });
}
