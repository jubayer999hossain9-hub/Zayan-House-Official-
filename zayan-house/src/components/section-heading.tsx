import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({ eyebrow, title, subtitle, href, linkLabel = "View all" }: { eyebrow?: string; title: string; subtitle?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-gold-dark">{eyebrow}</p>}
        <h2 className="mt-1.5 text-3xl text-green sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold tracking-wide text-green hover:text-gold-dark">
          {linkLabel} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
