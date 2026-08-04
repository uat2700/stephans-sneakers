import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Brand } from "@/lib/catalog";

export function BrandRail({ brands }: { brands: Brand[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  // Endless marquee: the list is rendered twice and the scroll position wraps
  // at the halfway point, so it never reaches an end. Users can still swipe or
  // drag freely — auto-scroll pauses while they interact.
  useEffect(() => {
    const el = railRef.current;
    if (!el || brands.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let last = performance.now();

    const wrap = () => {
      const half = el.scrollWidth / 2;
      if (half <= 0) return;
      if (el.scrollLeft >= half) el.scrollLeft -= half;
      else if (el.scrollLeft <= 0) el.scrollLeft += half;
    };

    const tick = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      if (!pausedRef.current) {
        el.scrollLeft += (dt / 1000) * 28; // ~28px per second
        const half = el.scrollWidth / 2;
        if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    el.addEventListener("scroll", wrap, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", wrap);
    };
  }, [brands.length]);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  const scrollBy = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  };


  return (
    <div className="relative">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight">
            Shop by brand
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Swipe to browse every label we stock.
          </p>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <button
            type="button"
            aria-label="Scroll brands left"
            onClick={() => scrollBy(-1)}
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background transition hover:border-foreground"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Scroll brands right"
            onClick={() => scrollBy(1)}
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background transition hover:border-foreground"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className="mt-6 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0"
      >
        {brands.map((b) => (
          <Link
            key={b.id}
            to="/shop"
            search={{ brand: b.slug }}
            className="card-lift group relative w-[62%] shrink-0 snap-start overflow-hidden rounded-3xl border border-border bg-background sm:w-[38%] lg:w-[23%]"
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-surface">
              {b.logo_url ? (
                <img
                  src={b.logo_url}
                  alt={`${b.name} sneakers`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="grid h-full w-full place-items-center">
                  <span className="font-display text-2xl font-extrabold uppercase text-muted-foreground">
                    {b.name}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 px-4 py-3">
              <span className="truncate font-display text-sm font-extrabold uppercase tracking-tight">
                {b.name}
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
