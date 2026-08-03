import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/catalog";

function nextMidnight() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

function useCountdown() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, nextMidnight() - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  if (left === null) return null;
  const total = Math.floor(left / 1000);
  return {
    h: String(Math.floor(total / 3600)).padStart(2, "0"),
    m: String(Math.floor((total % 3600) / 60)).padStart(2, "0"),
    s: String(total % 60).padStart(2, "0"),
  };
}

export function FlashSale({
  products,
  onQuickView,
}: {
  products: Product[];
  onQuickView?: (p: Product) => void;
}) {
  const time = useCountdown();
  if (!products.length) return null;

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex min-w-0 items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
            <Flame className="h-6 w-6 shrink-0 text-gold" aria-hidden="true" />
            <span className="truncate">Flash sale</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Discounted pairs — ends when the timer hits zero.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5" aria-label="Time remaining">
          {(time ? [time.h, time.m, time.s] : ["--", "--", "--"]).map((part, i) => (
            <span
              key={i}
              className="grid h-11 w-11 place-items-center rounded-xl bg-foreground font-display text-base font-extrabold tabular-nums text-background"
            >
              {part}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onQuickView={onQuickView} />
        ))}
      </div>

      <div className="mt-6">
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/shop" search={{ sort: "price-asc" }}>
            See all deals
          </Link>
        </Button>
      </div>
    </div>
  );
}
