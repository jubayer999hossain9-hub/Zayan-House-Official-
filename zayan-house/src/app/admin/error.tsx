"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg p-10 text-center">
      <h1 className="text-3xl text-green">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">This admin page could not be loaded. Nothing was lost. Please try again.</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-6">Try again</button>
    </div>
  );
}
