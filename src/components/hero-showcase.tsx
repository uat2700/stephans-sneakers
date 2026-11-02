import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
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
 * Full-bleed auto-sliding hero. Admin promotions (Admin → Homepage banners)
 * come first, then featured products. Falls back to the static hero image
 * with the admin-managed hero title.
 */
export function HeroShowcase({
  products,
  banners = [],
  fallbackImage,
  heroTitle,
  heroSubtitle,
}: {
  products: Product[];
  banners?: PublicBanner[];
  fallbackImage: string;
  heroTitle?: string;
  heroSubtitle?: string;
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
          <Link key={b.id} to="/shop" aria-hidden={!active} tabIndex={active ? 0 : -1} className={className}>
            {children}
          </Link>
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
      <div className="relative h-[62svh] max-h-[560px] min-h-[380px] w-full overflow-hidden bg-surface">
        <img
          src={fallbackImage}
          alt={heroTitle ?? "Store hero"}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 pb-14 sm:p-10 sm:pb-16">
          <h1 className="max-w-md font-display text-3xl font-extrabold uppercase leading-[0.95] text-white sm:text-5xl">
            {heroTitle}
            {heroSubtitle ? <span className="block text-white/80">{heroSubtitle}</span> : null}
          </h1>
          <Link
            to="/shop"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-background px-6 text-sm font-semibold text-foreground"
          >
            Shop now <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
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
      <div className="relative h-[62svh] max-h-[560px] min-h-[380px] w-full overflow-hidden bg-surface">
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 pb-16 sm:p-10 sm:pb-18">
          <p className="max-w-md font-display text-2xl font-extrabold uppercase leading-[0.95] text-white sm:text-4xl">
            {current.title}
          </p>
          {current.subtitle ? (
            <p className="mt-1 text-sm font-semibold text-white/80">{current.subtitle}</p>
          ) : null}
        </div>
        <div className="pointer-events-none absolute bottom-5 left-6 sm:left-10">
          <span className="inline-flex h-10 items-center gap-2 rounded-full bg-background px-5 text-sm font-semibold text-foreground">
            Shop now <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        {slides.length > 1 && (
          <div className="absolute bottom-7 right-6 flex gap-1.5 sm:right-10">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Show ${s.title}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-5 bg-whatsapp" : "w-2 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
