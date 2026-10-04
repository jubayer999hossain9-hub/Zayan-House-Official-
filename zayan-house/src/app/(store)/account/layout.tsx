import Link from "next/link";
import { requireCustomer } from "@/lib/auth";
import { logoutCustomer } from "@/app/actions/auth";

const NAV = [
  { href: "/account", label: "Dashboard" },
  { href: "/account/orders", label: "My Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Profile" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireCustomer();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 md:grid-cols-[210px_minmax(0,1fr)]">
        <nav aria-label="Account" className="min-w-0 md:sticky md:top-28 md:h-fit">
          <ul className="flex gap-1 overflow-x-auto border-b border-line pb-2 md:flex-col md:border-b-0 md:border-r md:pb-0 md:pr-4">
            {NAV.map((n) => (
              <li key={n.href} className="shrink-0">
                <Link href={n.href} className="block whitespace-nowrap px-3 py-2 text-sm font-medium text-green hover:bg-cream hover:text-gold-dark">
                  {n.label}
                </Link>
              </li>
            ))}
            <li className="shrink-0 md:mt-4">
              <form action={logoutCustomer}>
                <button type="submit" className="block w-full whitespace-nowrap px-3 py-2 text-left text-sm font-medium text-muted hover:text-danger">Log out</button>
              </form>
            </li>
          </ul>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
