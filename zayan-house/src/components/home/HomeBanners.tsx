import type { ReactNode } from "react";
import { getActiveBanners } from "@/lib/home/queries";
import { HomeBannerSlider } from "./HomeBannerSlider";

// Shows the slider when at least one banner is active.
// Otherwise shows whatever you pass as "fallback" (your current banner).
export async function HomeBanners({ fallback = null }: { fallback?: ReactNode }) {
  const banners = await getActiveBanners();
  if (banners.length === 0) return <>{fallback}</>;
  return <HomeBannerSlider banners={banners} />;
}
