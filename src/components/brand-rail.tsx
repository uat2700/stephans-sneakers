import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Brand } from "@/lib/catalog";

export function BrandRail({ brands }: { brands: Brand[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const indexRef = useRef(0);

  // Endless brand-by-brand marquee: the list is rendered twice, we advance one
  // card per tick and silently jump back to the first copy once the second copy
  // starts, so the loop never ends. Pauses while the user interacts.
  useEffect(() => {
    const el = railRef.current;
    if (!el || brands.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cardStep = () => {
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return 0;
      const gap = parseFloat(getComputedStyle(el).columnGap || "0") || 0;
      return card.offsetWidth + gap;
    };

    const tick = () => {
      if (pausedRef.current) return;
      const step = cardStep();
      if (!step) return;

      // Resync the index with wherever the user left the rail after swiping.
      indexRef.current = Math.round(el.scrollLeft / step);

      if (indexRef.current >= brands.length) {
        // Instant, invisible rewind to the identical position in copy #1.
        el.style.scrollSnapType = "none";
        el.style.scrollBehavior = "auto";
        el.scrollLeft -= brands.length * step;
        indexRef.current -= brands.length;
        el.style.scrollBehavior = "";
        el.style.scrollSnapType = "";
      }

      indexRef.current += 1;
      el.scrollTo({ left: indexRef.current * step, behavior: "smooth" });
    };

    const id = window.setInterval(tick, 2600);
    return () => window.clearInterval(id);
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
    const card = el.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(el).columnGap || "0") || 0;
    const amount = card ? card.offsetWidth + gap : Math.max(240, el.clientWidth * 0.8);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
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
        onPointerDown={pause}
        onPointerUp={resume}
        onPointerCancel={resume}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
        onFocusCapture={pause}
        onBlurCapture={resume}
        className="mt-6 -mx-4 flex snap-x snap-proximity gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0"
      >
        {[...brands, ...brands].map((b, i) => (
          <Link
            key={`${b.id}-${i}`}
            to="/shop"
            search={{ brand: b.slug }}
            aria-hidden={i >= brands.length ? true : undefined}
            tabIndex={i >= brands.length ? -1 : undefined}
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
