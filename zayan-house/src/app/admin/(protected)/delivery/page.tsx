import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { deliveryZones } from "@/db/schema";
import { saveZone } from "@/app/actions/admin-site";
import { PageHeader, Flash } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Delivery" };
export const dynamic = "force-dynamic";

export default async function AdminDelivery({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const zones = await db.select().from(deliveryZones).orderBy(asc(deliveryZones.sortOrder), asc(deliveryZones.id));
  return (
    <div>
      <PageHeader title="Delivery" subtitle="Customers in Dhaka district pay the Inside Dhaka charge; every other district pays the Outside Dhaka charge. The charge is always calculated on the server." />
      <Flash ok={sp.ok} error={sp.error} />
      {zones.length === 0 && <p className="border border-line bg-cream p-6 text-sm text-muted">No delivery zones found. Run <code>npm run db:seed</code> to create them.</p>}
      <div className="grid gap-6 md:grid-cols-2">
        {zones.map((z) => (
          <form key={z.id} action={saveZone} className="space-y-4 border border-line bg-cream p-5">
            <input type="hidden" name="id" value={z.id} />
            <h2 className="text-xl text-green">{z.name}</h2>
            <div><label htmlFor={`z-${z.id}-c`} className="label">Delivery charge (৳)</label><input id={`z-${z.id}-c`} name="charge" defaultValue={z.charge} inputMode="numeric" className="field" /></div>
            <div><label htmlFor={`z-${z.id}-f`} className="label">Free delivery on orders of (৳) or more</label><input id={`z-${z.id}-f`} name="freeDeliveryThreshold" defaultValue={z.freeDeliveryThreshold ?? ""} inputMode="numeric" className="field" /><p className="mt-1 text-xs text-muted">Leave empty for no free delivery.</p></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={z.isActive} /> Delivering to this area (untick to stop orders from here)</label>
            <button type="submit" className="btn btn-primary">Save</button>
          </form>
        ))}
      </div>
    </div>
  );
}
