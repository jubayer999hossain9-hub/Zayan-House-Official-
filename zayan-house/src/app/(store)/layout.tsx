import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TrustBar } from "@/components/trust-bar";
import { WhatsAppButton } from "@/components/whatsapp-button";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <TrustBar />
      <SiteFooter />
      <WhatsAppButton />
    </>
  );
}
