import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Zayan House collects, uses and protects your personal information.",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return <ContentPage pageKey="privacy" />;
}
