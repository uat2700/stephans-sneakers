import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Search, TrendingUp, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { brandsQuery, categoriesQuery, primaryImage, productsQuery } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const RECENT_KEY = "sc_recent_searches";
const TRENDING = ["Air Force 1", "Jordan", "Nike", "Slides", "Running", "New Balance"];

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as string[]).slice(0, 6) : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(term: string) {
  if (typeof window === "undefined" || !term.trim()) return;
  const next = [term.trim(), ...readRecent().filter((t) => t !== term.trim())].slice(0, 6);
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

type Props = {
  className?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
};

export function SearchPanel({ className, autoFocus, onNavigate }: Props) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  const products = useQuery({ ...productsQuery(), enabled: open });
  const brands = useQuery({ ...brandsQuery(), enabled: open });
  const categories = useQuery({ ...categoriesQuery(), enabled: open });

  useEffect(() => setRecent(readRecent()), [open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const q = term.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!q) return [];
    return (products.data ?? [])
      .filter((p) =>
        `${p.name} ${p.brands?.name ?? ""} ${p.categories?.name ?? ""} ${p.tags.join(" ")}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 6);
  }, [products.data, q]);

  const brandMatches = useMemo(
    () => (brands.data ?? []).filter((b) => b.name.toLowerCase().includes(q)).slice(0, 4),
    [brands.data, q],
  );
  const categoryMatches = useMemo(
    () => (categories.data ?? []).filter((c) => c.name.toLowerCase().includes(q)).slice(0, 4),
    [categories.data, q],
  );

  function go(value: string) {
    const clean = value.trim();
    pushRecentSearch(clean);
    setOpen(false);
    setTerm(clean);
    onNavigate?.();
    navigate({ to: "/shop", search: { q: clean || undefined } });
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(term);
        }}
        role="search"
      >
        <div className="flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            value={term}
            autoFocus={autoFocus}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setTerm(e.target.value);
              setOpen(true);
            }}
            placeholder="Search sneakers, brands, categories…"
            aria-label="Search sneakers"
            className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {term ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setTerm("")}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </form>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-background p-3 shadow-2xl"
          >
            {!q ? (
              <div className="space-y-4">
                {recent.length ? (
                  <div>
                    <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Recent searches
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recent.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => go(r)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-foreground"
                        >
                          <Clock className="h-3 w-3" aria-hidden="true" /> {r}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div>
                  <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Trending searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => go(t)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        <TrendingUp className="h-3 w-3" aria-hidden="true" /> {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {brandMatches.length || categoryMatches.length ? (
                  <div className="flex flex-wrap gap-2">
                    {brandMatches.map((b) => (
                      <Link
                        key={b.id}
                        to="/shop"
                        search={{ brand: b.slug }}
                        onClick={() => {
                          setOpen(false);
                          onNavigate?.();
                        }}
                        className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold"
                      >
                        {b.name}
                      </Link>
                    ))}
                    {categoryMatches.map((c) => (
                      <Link
                        key={c.id}
                        to="/shop"
                        search={{ category: c.slug }}
                        onClick={() => {
                          setOpen(false);
                          onNavigate?.();
                        }}
                        className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                ) : null}

                {matches.length ? (
                  <ul className="divide-y divide-border">
                    {matches.map((p) => {
                      const image = primaryImage(p);
                      return (
                        <li key={p.id}>
                          <Link
                            to="/product/$slug"
                            params={{ slug: p.slug }}
                            onClick={() => {
                              pushRecentSearch(term);
                              setOpen(false);
                              onNavigate?.();
                            }}
                            className="flex items-center gap-3 rounded-xl p-2 hover:bg-surface"
                          >
                            <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface">
                              {image ? (
                                <img
                                  src={image}
                                  alt={p.name}
                                  loading="lazy"
                                  className="h-full w-full object-cover"
                                />
                              ) : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                {p.name}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {p.brands?.name ?? "Sneaker"}
                              </span>
                            </span>
                            <span className="shrink-0 text-sm font-bold">
                              {formatPrice(p.selling_price)}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="px-2 py-4 text-sm text-muted-foreground">
                    No matches yet — press enter to search the full shop.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
