import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TrustBar } from "@/components/trust-bar";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getSettings } from "@/lib/settings";
import { googleFontsHref, themeToCssVars, type ThemeValues } from "@/lib/theme";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const theme = settings.theme as Partial<ThemeValues>;
  const css = themeToCssVars(theme);
  const fontsHref = googleFontsHref(theme);
  return (
    <>
      {fontsHref && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link rel="stylesheet" href={fontsHref} />
        </>
      )}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <TrustBar />
      <SiteFooter />
      <WhatsAppButton />
    </>
  );
}
