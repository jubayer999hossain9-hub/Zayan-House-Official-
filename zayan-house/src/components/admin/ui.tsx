import Link from "next/link";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-3xl text-green">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Success / error banner driven by ?ok= and ?error= in the URL (set after a redirect). */
export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <p role={error ? "alert" : "status"} className={`mb-5 border px-4 py-3 text-sm ${error ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success"}`}>
      {error || ok}
    </p>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border border-line bg-cream p-5 ${className}`}>
      {title && <h2 className="mb-4 text-xl text-green">{title}</h2>}
      {children}
    </section>
  );
}

export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto border border-line bg-cream"><table className="w-full min-w-[640px] text-left text-sm">{children}</table></div>;
}

export const th = "border-b border-line px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted";
export const td = "border-b border-line/60 px-4 py-3 align-middle";

export function Pager({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (p: number) => string }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-3">
      {page > 1 && <Link href={hrefFor(page - 1)} className="btn btn-outline !px-4 !py-2">Previous</Link>}
      <span className="text-sm text-muted">Page {page} of {totalPages}</span>
      {page < totalPages && <Link href={hrefFor(page + 1)} className="btn btn-outline !px-4 !py-2">Next</Link>}
    </nav>
  );
}

export function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function pageParam(v: string | undefined): number {
  return /^\d{1,4}$/.test(v ?? "") ? Math.max(1, Number(v)) : 1;
}
