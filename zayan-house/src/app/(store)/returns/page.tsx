import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Returns & Refunds",
  description: "Zayan House returns, exchanges and refunds policy.",
  alternates: { canonical: "/returns" },
};

export default function Page() {
  return <ContentPage pageKey="returns" />;
}
