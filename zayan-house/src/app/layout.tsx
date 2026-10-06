import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { getSettings } from "@/lib/settings";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${settings.general.siteName} — ${settings.general.tagline}`,
      template: `%s | ${settings.general.siteName}`,
    },
    description: settings.general.description,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-cream text-charcoal antialiased selection:bg-gold/30`}>
        {children}
      </body>
    </html>
  );
}