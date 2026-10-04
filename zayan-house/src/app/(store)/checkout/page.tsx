import type { Metadata } from "next";
import { eq, asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { customerAddresses } from "@/db/schema";
import { getCurrentCustomer } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [customer, settings] = await Promise.all([getCurrentCustomer(), getSettings()]);
  const addresses = customer?.customerId
    ? await db
        .select({
          id: customerAddresses.id, label: customerAddresses.label, fullName: customerAddresses.fullName, phone: customerAddresses.phone,
          address: customerAddresses.address, area: customerAddresses.area, city: customerAddresses.city,
          district: customerAddresses.district, postalCode: customerAddresses.postalCode,
        })
        .from(customerAddresses)
        .where(eq(customerAddresses.customerId, customer.customerId))
        .orderBy(desc(customerAddresses.isDefault), asc(customerAddresses.id))
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-4xl text-green sm:text-5xl">Checkout</h1>
      {!settings.payment.codEnabled ? (
        <p role="alert" className="border border-danger/30 bg-danger/5 p-6 text-danger">Ordering is temporarily unavailable. Please contact us on WhatsApp.</p>
      ) : (
        <CheckoutForm
          user={customer ? { name: customer.name, email: customer.email, phone: customer.phone, loggedIn: true } : null}
          addresses={addresses}
          codInstructions={settings.payment.codInstructions}
        />
      )}
    </div>
  );
}
