"use client";

import { useState } from "react";

export function AdminLogo() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gold font-serif text-lg font-semibold text-green-dark">
        Z
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt=""
      width={36}
      height={36}
      onError={() => setFailed(true)}
      className="h-9 w-auto"
    />
  );
}