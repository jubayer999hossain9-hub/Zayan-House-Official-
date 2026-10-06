import { getHomeVideo } from "@/lib/home/queries";
import type { VideoPosition } from "@/lib/home/positions";
import { HomeVideoSection } from "./HomeVideoSection";

// Put one slot between each pair of homepage sections.
// Only the slot whose position matches the admin setting shows the video.
export async function HomeVideoSlot({ position }: { position: VideoPosition }) {
  const v = await getHomeVideo();
  if (!v || !v.isActive || !v.videoUrl || v.position !== position) return null;
  return (
    <HomeVideoSection
      videoUrl={v.videoUrl}
      posterUrl={v.posterUrl}
      title={v.title}
      description={v.description}
    />
  );
}
