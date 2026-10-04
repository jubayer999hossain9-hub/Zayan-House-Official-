import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customerAddresses } from "@/db/schema";
import { requireCustomer } from "@/lib/auth";
import { deleteAddress, setDefaultAddress } from "@/app/actions/account";
import { AddressForm } from "@/components/address-form";

export const metadata: Metadata = { title: "Saved Addresses", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AddressesPage({ searchParams }: { searchParams: Promise<{ new?: string; edit?: string }> }) {
  const customer = await requireCustomer();
  const sp = await searchParams;
  const addresses = customer.customerId
    ? await db.select().from(customerAddresses).where(eq(customerAddresses.customerId, customer.customerId)).orderBy(desc(customerAddresses.isDefault), asc(customerAddresses.id))
    : [];
  const defaults = { name: customer.name, phone: customer.phone ?? "" };

  if (sp.new !== undefined) {
    return (
      <div>
        <h1 className="mb-6 text-4xl text-green">Add address</h1>
        <AddressForm defaults={defaults} />
      </div>
    );
  }
  if (sp.edit && /^\d+$/.test(sp.edit)) {
    const a = addresses.find((x) => x.id === Number(sp.edit));
    if (a) {
      return (
        <div>
          <h1 className="mb-6 text-4xl text-green">Edit address</h1>
          <AddressForm defaults={defaults} initial={a} key={a.id} />
        </div>
      );
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl text-green">Saved Addresses</h1>
        <Link href="/account/addresses?new" className="btn btn-primary">Add address</Link>
      </div>
      {addresses.length === 0 ? (
        <div className="mt-8 border border-line bg-cream p-10 text-center">
          <h2 className="text-2xl text-green">No saved addresses</h2>
          <p className="mt-2 text-muted">Save an address to check out faster next time.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-col border border-line bg-cream p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-sans text-base font-semibold text-green">{a.label}</h2>
                {a.isDefault && <span className="bg-gold/20 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-gold-dark">Default</span>}
              </div>
              <p className="mt-2 text-sm">{a.fullName} · {a.phone}</p>
              <p className="text-sm text-muted">{a.address}</p>
              <p className="text-sm text-muted">{[a.area, a.city, a.district, a.postalCode].filter(Boolean).join(", ")}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-line pt-3 text-xs font-semibold uppercase tracking-wider">
                <Link href={`/account/addresses?edit=${a.id}`} className="text-green underline">Edit</Link>
                {!a.isDefault && (
                  <form action={setDefaultAddress}><input type="hidden" name="id" value={a.id} /><button type="submit" className="text-green underline">Make default</button></form>
                )}
                <form action={deleteAddress} className="ml-auto"><input type="hidden" name="id" value={a.id} /><button type="submit" className="text-danger underline">Delete</button></form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
