import Image from "next/image";

/** Product photo, or a branded placeholder when no photo has been uploaded yet. */
export function ProductImage({
  url, alt, className = "", priority = false,
}: { url: string | null; alt: string; className?: string; priority?: boolean }) {
  if (!url) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-gradient-to-br from-cream to-line/60 ${className}`}
      >
        <Image unoptimized src="/logo-mark.png" alt="" width={64} height={74} className="h-1/4 w-auto opacity-30" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" className={`object-cover ${className}`} />;
}
