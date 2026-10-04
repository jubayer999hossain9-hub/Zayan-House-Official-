"use client";

import { useState } from "react";
import { ProductImage } from "./product-image";

export function ProductGallery({ images, name }: { images: { id: number; url: string; alt: string | null }[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index];
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {images.length > 1 && (
        <ul className="flex gap-2 sm:w-20 sm:flex-col" aria-label="Product images">
          {images.map((img, i) => (
            <li key={img.id} className="w-16 shrink-0 sm:w-full">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                className={`block w-full overflow-hidden border ${i === index ? "border-green" : "border-line"}`}
              >
                <ProductImage url={img.url} alt="" className="aspect-[3/4] w-full" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex-1 overflow-hidden border border-line bg-cream">
        <ProductImage url={current?.url ?? null} alt={current?.alt || name} priority className="aspect-[3/4] w-full" />
      </div>
    </div>
  );
}
