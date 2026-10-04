import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TrustBar } from "@/components/trust-bar";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark">404</p>
        <h1 className="mt-3 text-5xl text-green">Page not found</h1>
        <p className="mt-3 max-w-md text-muted">The page you are looking for does not exist or has moved.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">Back to Home</Link>
          <Link href="/shop" className="btn btn-outline">Continue Shopping</Link>
        </div>
      </main>
      <TrustBar />
      <SiteFooter />
    </>
  );
}
