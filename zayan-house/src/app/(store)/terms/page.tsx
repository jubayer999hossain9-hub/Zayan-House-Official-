import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms for using the Zayan House website and placing orders.",
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return <ContentPage pageKey="terms" />;
}
