import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

/**
 * Rotating hero showcase. Cycles through the products the admin marks as
 * "Featured" (first image of each). Falls back to the static hero image
 * when there are no featured products with images.
 */
export function HeroShowcase({
  products,
  fallbackImage,
}: {
  products: Product[];
  fallbackImage: string;
}) {
  const slides = products
    .filter((p) => p.product_images.length > 0)
    .slice(0, 6);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      4500,
    );
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="overflow-hidden rounded-[2rem] bg-background shadow-xl">
        <img
          src={fallbackImage}
          alt="Premium white high-top sneaker"
          width={1920}
          height={1280}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const current = slides[index];

  return (
    <div className="relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-background shadow-xl">
        {slides.map((p, i) => (
          <Link
            key={p.id}
            to="/product/$slug"
            params={{ slug: p.slug }}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <img
              src={p.product_images[0].url}
              alt={p.product_images[0].alt ?? p.name}
              loading={i === 0 ? "eager" : "lazy"}
              className="h-full w-full object-cover"
            />
          </Link>
        ))}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 pt-16">
          <p className="font-display text-lg font-bold text-white">
            {current.name}
          </p>
          <p className="text-sm font-semibold text-white/80">
            {formatPrice(current.selling_price)}
          </p>
        </div>
      </div>
      {slides.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {slides.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`Show ${p.name}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-foreground" : "w-2 bg-foreground/25"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
