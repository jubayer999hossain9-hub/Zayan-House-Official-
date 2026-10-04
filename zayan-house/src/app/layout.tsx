import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} | Women's Fashion`, template: `%s | ${SITE_NAME}` },
  description: "Zayan House: refined women's fashion. Kurti, saree, three piece and party wear, delivered across Bangladesh.",
  openGraph: { type: "website", siteName: SITE_NAME, images: ["/logo.png"] },
};

export const viewport: Viewport = { themeColor: "#0F3D35" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        {children}
      </body>
    </html>
  );
}
