import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zayan House — Modest elegance, made modern",
  description: "Modest elegance, made modern",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cream text-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}
