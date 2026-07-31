import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Brand } from "@/lib/catalog";

export function BrandRail({ brands }: { brands: Brand[] }) {
  const railRef = useRef<HTMLDivElement>(null);

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
