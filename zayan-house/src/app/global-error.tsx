"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#F8F5EE", color: "#17201E", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", textAlign: "center", margin: 0 }}>
        <div style={{ padding: 24 }}>
          <h1 style={{ color: "#0F3D35" }}>Something went wrong</h1>
          <p>Please try again in a moment.</p>
          <button onClick={reset} style={{ background: "#0F3D35", color: "#FCFAF5", border: 0, padding: "12px 24px", cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  );
}