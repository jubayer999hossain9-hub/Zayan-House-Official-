import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

export const PAGE_KEYS = ["about", "shipping", "returns", "privacy", "terms"] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

export const PAGE_TITLES: Record<PageKey, string> = {
  about: "About Zayan House",
  shipping: "Shipping & Delivery",
  returns: "Returns & Refunds",
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
};

/**
 * Standard starting text for each page. The shop owner can replace any of it in Admin > Pages.
 * IMPORTANT: these are sensible defaults, not legal advice. The owner should review them and make sure
 * every promise (days, fees, conditions) matches how the business really works.
 */
export const DEFAULT_PAGES: Record<PageKey, string> = {
  about: `Zayan House is a women's fashion brand built around quiet elegance. We select every kurti, saree, three piece and party wear piece for its fabric, its finish and the way it makes you feel.

## What we believe
- Beautiful clothing should feel comfortable and look refined.
- Honest descriptions and fair prices.
- Careful packing and reliable delivery across Bangladesh.

## Our promise
We want every order to arrive exactly as you imagined. If anything is not right, talk to us on WhatsApp and we will do our best to make it right.`,

  shipping: `We deliver across Bangladesh. Orders are confirmed by phone or WhatsApp before they are sent.

## Delivery time
- Inside Dhaka: usually 1 to 3 working days after confirmation.
- Outside Dhaka: usually 3 to 5 working days after confirmation.
These are estimates. Public holidays, weather and courier delays can add time.

## Payment
Cash on Delivery is available. You pay the delivery person when your parcel arrives. Please keep the exact amount ready if you can.

## Before you receive your parcel
Please make sure someone is available at the delivery address and that your phone number is correct. If our courier cannot reach you, delivery may be delayed or cancelled.`,

  returns: `We want you to love what you ordered. If something is not right, please contact us as soon as possible.

## Exchanges and returns
- Contact us within 3 days of receiving your order.
- The item must be unworn, unwashed and in its original condition with tags attached.
- If you received a wrong, damaged or defective item, we will replace it or refund you at no extra cost.
- For size or colour preference changes, the delivery charge for the exchange is paid by the customer.

## Items we cannot take back
Items that have been worn, washed, altered or damaged after delivery cannot be returned. Sale items may be exchanged but not refunded, unless they are defective.

## How to start a return
Message us on WhatsApp with your order number and a clear photo of the item. Our team will guide you through the next steps.`,

  privacy: `This policy explains what information Zayan House collects and how we use it.

## What we collect
- Details you give us when you order or create an account: name, phone number, email address and delivery address.
- Your order history.
- Basic technical information needed to keep the website working and secure.

## How we use it
- To confirm, pack and deliver your orders.
- To contact you about your order.
- To improve our shop and, if you subscribed, to send you news and offers.

## Sharing
We share your name, phone number and address only with the courier who delivers your parcel. We do not sell your personal information.

## Your choices
You can ask us to correct or delete your account information, and you can unsubscribe from emails at any time. Contact us using the details on our Contact page.

## Security
Passwords are stored in a protected form and we limit access to customer information to the people who need it.`,

  terms: `By using this website and placing an order, you agree to these terms.

## Orders
- An order is accepted only after we confirm it with you.
- We may cancel an order if an item is out of stock, if there is a pricing error, or if we cannot confirm your details. If that happens, you will not be charged.

## Prices and payment
- All prices are in Bangladeshi Taka (৳) and may change without notice. The price at the time you place the order applies.
- Delivery charges are shown at checkout before you place the order.
- We currently accept Cash on Delivery.

## Product information
We try to show colours and details accurately. Slight differences can happen because of photography and screen settings.

## Delivery and returns
Please read our Shipping & Delivery and Returns & Refunds pages, which form part of these terms.

## Changes
We may update these terms from time to time. The version on this page is the current one.`,
};

/** Returns the page text: the owner's saved version if there is one, otherwise the standard text. */
export const getPageBody = cache(async (key: PageKey): Promise<string> => {
  try {
    const [row] = await db.select().from(settings).where(eq(settings.key, "pages")).limit(1);
    const saved = (row?.value as Record<string, unknown> | undefined)?.[key];
    if (typeof saved === "string" && saved.trim() !== "") return saved;
  } catch (error) {
    console.error("Could not load page content:", error);
  }
  return DEFAULT_PAGES[key];
});

export async function getSavedPages(): Promise<Partial<Record<PageKey, string>>> {
  try {
    const [row] = await db.select().from(settings).where(eq(settings.key, "pages")).limit(1);
    const v = (row?.value ?? {}) as Record<string, unknown>;
    return Object.fromEntries(PAGE_KEYS.map((k) => [k, typeof v[k] === "string" ? (v[k] as string) : ""]));
  } catch {
    return {};
  }
}
