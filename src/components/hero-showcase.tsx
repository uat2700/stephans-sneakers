import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/catalog";
import type { PublicBanner } from "@/lib/store-settings";
import { formatPrice } from "@/lib/format";

type Slide = {
  id: string;
  image: string;
  alt: string;
  title: string;
  subtitle?: string | null;
  wrap: (children: ReactNode, active: boolean, className: string) => ReactNode;
};

/**
 * Auto-sliding hero. Shows admin promotions (Admin → Homepage banners) first,
 * then featured products. Falls back to the static hero image.
 */
export function HeroShowcase({
  products,
  banners = [],
  fallbackImage,
}: {
  products: Product[];
  banners?: PublicBanner[];
  fallbackImage: string;
}) {
  const promoSlides: Slide[] = banners
    .filter((b) => b.image_url)
    .map((b) => ({
      id: `b-${b.id}`,
      image: b.image_url!,
      alt: b.title,
      title: b.title,
      subtitle: b.subtitle,
      wrap: (children, active, className) =>
        b.link_url ? (
          <a key={b.id} href={b.link_url} aria-hidden={!active} tabIndex={active ? 0 : -1} className={className}>
            {children}
          </a>
        ) : (
          <div key={b.id} aria-hidden={!active} className={className}>
            {children}
          </div>
        ),
    }));

  const productSlides: Slide[] = products
    .filter((p) => p.product_images.length > 0)
    .slice(0, 6)
    .map((p) => ({
      id: `p-${p.id}`,
      image: p.product_images[0].url,
      alt: p.product_images[0].alt ?? p.name,
      title: p.name,
      subtitle: formatPrice(p.selling_price),
      wrap: (children, active, className) => (
        <Link
          key={p.id}
          to="/product/$slug"
          params={{ slug: p.slug }}
          aria-hidden={!active}
          tabIndex={active ? 0 : -1}
          className={className}
        >
          {children}
        </Link>
      ),
    }));

  const slides = [...promoSlides, ...productSlides];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4500);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [index, slides.length]);

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

  const current = slides[Math.min(index, slides.length - 1)];

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-background shadow-xl">
        {slides.map((s, i) =>
          s.wrap(
            <img
              src={s.image}
              alt={s.alt}
              loading={i === 0 ? "eager" : "lazy"}
              className="h-full w-full object-cover"
            />,
            i === index,
            `absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`,
          ),
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-16">
          <p className="font-display text-lg font-bold text-white">{current.title}</p>
          {current.subtitle ? (
            <p className="text-sm font-semibold text-white/80">{current.subtitle}</p>
          ) : null}
        </div>
      </div>
      {slides.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Show ${s.title}`}
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
