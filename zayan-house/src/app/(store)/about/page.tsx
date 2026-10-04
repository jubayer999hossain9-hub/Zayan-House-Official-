import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Zayan House: refined women's fashion with kurti, saree, three piece and party wear, delivered across Bangladesh.",
  alternates: { canonical: "/about" },
};

export default function Page() {
  return <ContentPage pageKey="about" />;
}
