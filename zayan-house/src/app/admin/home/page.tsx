import { assertHomeAdmin } from "@/lib/home/guard";
import { getAllBanners, getHomeVideo } from "@/lib/home/queries";
import { HomeContentManager } from "@/components/admin/HomeContentManager";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  await assertHomeAdmin();
  const [banners, video] = await Promise.all([getAllBanners(), getHomeVideo()]);
  return <HomeContentManager banners={banners} video={video} />;
}
