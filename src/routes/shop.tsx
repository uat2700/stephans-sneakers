import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { QuickView } from "@/components/quick-view";
import { ProductGridSkeleton, EmptyState } from "@/components/product-grid-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  brandsQuery,
  categoriesQuery,
  productsQuery,
  type Product,
} from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { GENDER_OPTIONS } from "@/lib/site";

type ShopSearch = {
  q?: string;
  brand?: string;
  category?: string;
  sort?: string;
};

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
    brand:
      typeof search.brand === "string" && search.brand ? search.brand : undefined,
    category:
      typeof search.category === "string" && search.category
        ? search.category
        : undefined,
    sort: typeof search.sort === "string" && search.sort ? search.sort : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop Sneakers — Stephans Collection" },
      {
        name: "description",
        content:
          "Browse every sneaker in stock. Filter by brand, size, colour and price, then order on WhatsApp for fast delivery in Ghana.",
      },
      { property: "og:title", content: "Shop Sneakers — Stephans Collection" },
      {
        property: "og:description",
        content: "Filter by brand, size, colour and price. Delivered across Ghana.",
      },
    ],
  }),
  component: Shop,
});

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "popular", label: "Most popular" },
];

function Shop() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const products = useQuery(productsQuery());
  const brands = useQuery(brandsQuery());
  const categories = useQuery(categoriesQuery());

  const [quick, setQuick] = useState<Product | null>(null);
  const [term, setTerm] = useState(search.q ?? "");
  const [sizes, setSizes] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const all = products.data ?? [];
  const priceCeiling = Math.max(1000, ...all.map((p) => p.selling_price));

  const availableSizes = useMemo(
    () =>
      Array.from(new Set(all.flatMap((p) => p.sizes))).sort(
        (a, b) => Number(a) - Number(b),
      ),
    [all],
  );

  const filtered = useMemo(() => {
    const q = (search.q ?? "").toLowerCase();
    let list = all.filter((p) => {
      if (q && !`${p.name} ${p.brands?.name ?? ""} ${p.tags.join(" ")}`.toLowerCase().includes(q))
        return false;
      if (search.brand && p.brands?.slug !== search.brand) return false;
      if (search.category && p.categories?.slug !== search.category) return false;
      if (sizes.length && !p.sizes.some((s) => sizes.includes(s))) return false;
      if (genders.length && !genders.includes(p.gender)) return false;
      if (maxPrice !== null && p.selling_price > maxPrice) return false;
      return true;
    });

    switch (search.sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.selling_price - b.selling_price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.selling_price - a.selling_price);
        break;
      case "popular":
        list = [...list].sort((a, b) => b.popularity - a.popularity);
        break;
      default:
        break;
    }
    return list;
  }, [all, search, sizes, genders, maxPrice]);

  const activeFilters =
    (search.brand ? 1 : 0) +
    (search.category ? 1 : 0) +
    sizes.length +
    genders.length +
    (maxPrice !== null ? 1 : 0);

  function setSearch(patch: Partial<ShopSearch>) {
    navigate({ search: (prev: ShopSearch) => ({ ...prev, ...patch }) });
  }

  function clearAll() {
    setSizes([]);
    setGenders([]);
    setMaxPrice(null);
    setTerm("");
    navigate({ search: {} });
  }

  const filterPanel = (
    <div className="space-y-7">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em]">Brand</h3>
        <div className="mt-3 space-y-2">
          {(brands.data ?? []).map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() =>
                setSearch({ brand: search.brand === b.slug ? undefined : b.slug })
              }
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                search.brand === b.slug
                  ? "bg-foreground text-background"
                  : "hover:bg-surface"
              }`}
            >
              {b.name}
            </button>
          ))}
          {!brands.data?.length ? (
            <p className="text-sm text-muted-foreground">No brands yet.</p>
          ) : null}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em]">
          Category
        </h3>
        <div className="mt-3 space-y-2">
          {(categories.data ?? []).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() =>
                setSearch({
                  category: search.category === c.slug ? undefined : c.slug,
                })
              }
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                search.category === c.slug
                  ? "bg-foreground text-background"
                  : "hover:bg-surface"
              }`}
            >
              {c.name}
            </button>
          ))}
          {!categories.data?.length ? (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          ) : null}
        </div>
      </div>

      {availableSizes.length ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em]">Size</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {availableSizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() =>
                  setSizes((prev) =>
                    prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
                  )
                }
                className={`h-9 min-w-11 rounded-lg border px-3 text-sm font-medium transition ${
                  sizes.includes(s)
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em]">Gender</h3>
        <div className="mt-3 space-y-2">
          {GENDER_OPTIONS.map((g) => (
            <div key={g} className="flex items-center gap-2">
              <Checkbox
                id={`gender-${g}`}
                checked={genders.includes(g)}
                onCheckedChange={(checked) =>
                  setGenders((prev) =>
                    checked ? [...prev, g] : prev.filter((x) => x !== g),
                  )
                }
              />
              <Label htmlFor={`gender-${g}`} className="text-sm capitalize">
                {g}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em]">
          Max price
        </h3>
        <Slider
          className="mt-4"
          min={0}
          max={priceCeiling}
          step={50}
          value={[maxPrice ?? priceCeiling]}
          onValueChange={([v]) => setMaxPrice(v)}
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Up to {formatPrice(maxPrice ?? priceCeiling)}
        </p>
      </div>

      {activeFilters > 0 ? (
        <Button variant="outline" className="w-full rounded-full" onClick={clearAll}>
          <X className="h-4 w-4" aria-hidden="true" /> Clear filters
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className="container-page py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>{" "}
        / <span className="text-foreground">Shop</span>
      </nav>

      <h1 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
        All sneakers
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "product" : "products"} available
      </p>

      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch({ q: term.trim() || undefined });
        }}
      >
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by name or brand…"
          aria-label="Search products"
          className="h-11 rounded-full"
        />
        <div className="flex gap-2">
          <Button type="submit" className="h-11 rounded-full px-6">
            Search
          </Button>
          <Select
            value={search.sort ?? "newest"}
            onValueChange={(v) => setSearch({ sort: v })}
          >
            <SelectTrigger className="h-11 w-[170px] rounded-full" aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-11 rounded-full lg:hidden">
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                {activeFilters ? ` (${activeFilters})` : ""}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto p-6">
              <SheetTitle className="mb-6">Filters</SheetTitle>
              {filterPanel}
            </SheetContent>
          </Sheet>
        </div>
      </form>

      <div className="sticky top-[60px] z-30 -mx-4 mt-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={clearAll}
            className={`h-9 shrink-0 rounded-full border px-4 text-xs font-semibold transition ${
              activeFilters === 0
                ? "border-foreground bg-foreground text-background"
                : "border-border"
            }`}
          >
            All
          </button>
          {(brands.data ?? []).map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() =>
                setSearch({ brand: search.brand === b.slug ? undefined : b.slug })
              }
              className={`h-9 shrink-0 rounded-full border px-4 text-xs font-semibold transition ${
                search.brand === b.slug
                  ? "border-foreground bg-foreground text-background"
                  : "border-border"
              }`}
            >
              {b.name}
            </button>
          ))}
          {(categories.data ?? []).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() =>
                setSearch({
                  category: search.category === c.slug ? undefined : c.slug,
                })
              }
              className={`h-9 shrink-0 rounded-full border px-4 text-xs font-semibold transition ${
                search.category === c.slug
                  ? "border-foreground bg-foreground text-background"
                  : "border-border"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 gap-10 lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">

        <aside className="hidden lg:block">{filterPanel}</aside>

        <div>
          {products.isLoading ? (
            <ProductGridSkeleton />
          ) : filtered.length ? (
            <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 sm:gap-5 xl:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} onQuickView={setQuick} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No sneakers match your filters"
              description="Try clearing a filter or searching for a different brand."
              action={
                <Button className="rounded-full" onClick={clearAll}>
                  Clear filters
                </Button>
              }
            />
          )}
        </div>
      </div>

      <QuickView product={quick} onOpenChange={(o) => !o && setQuick(null)} />
    </div>
  );
}
