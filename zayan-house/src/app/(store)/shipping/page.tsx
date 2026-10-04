import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { getActiveZones } from "@/lib/cart-resolve";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Shipping & Delivery",
  description: "Zayan House delivery areas, charges and delivery times across Bangladesh.",
  alternates: { canonical: "/shipping" },
};

export default async function Page() {
  const zones = await getActiveZones().catch(() => []);
  return (
    <ContentPage pageKey="shipping">
      {zones.length > 0 && (
        <section className="mt-10" aria-labelledby="charges">
          <h2 id="charges" className="mb-3 text-2xl text-green">Delivery charges</h2>
          <div className="overflow-x-auto border border-line bg-cream">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-line text-xs uppercase tracking-wider text-muted"><th className="px-4 py-3">Area</th><th className="px-4 py-3">Charge</th><th className="px-4 py-3">Free delivery</th></tr></thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.slug} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 font-medium">{z.name}</td>
                    <td className="px-4 py-3">{formatPrice(z.charge)}</td>
                    <td className="px-4 py-3">{z.freeThreshold ? `On orders of ${formatPrice(z.freeThreshold)} or more` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">The exact charge is shown at checkout before you place your order.</p>
        </section>
      )}
    </ContentPage>
  );
}
