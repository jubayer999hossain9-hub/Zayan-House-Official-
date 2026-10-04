export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" role="status" aria-label="Loading products">
      <div className="mb-8 h-12 w-40 animate-pulse bg-line/60" />
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <div className="hidden h-96 animate-pulse bg-line/40 lg:block" />
        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i}><div className="aspect-[3/4] animate-pulse bg-line/50" /><div className="mt-3 h-4 w-3/4 animate-pulse bg-line/50" /><div className="mt-2 h-4 w-1/3 animate-pulse bg-line/50" /></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
