import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
import { EmptyState, ProductGridSkeleton } from "@/components/product-grid-skeleton";
import { Button } from "@/components/ui/button";
import { productsQuery } from "@/lib/catalog";

export const Route = createFileRoute("/new-arrivals")({
  head: () => ({
    meta: [
      { title: "New Arrivals — Stephans Collection" },
      {
        name: "description",
        content:
          "The freshest sneaker drops just added at Stephans Collection, with fast delivery across Ghana.",
      },
      { property: "og:title", content: "New Arrivals — Stephans Collection" },
      { property: "og:description", content: "The freshest sneaker drops, just in." },
    ],
  }),
  component: NewArrivals,
});

function NewArrivals() {
  const products = useQuery(productsQuery());
  const list = (products.data ?? []).filter((p) => p.is_new);
  const shown = list.length ? list : (products.data ?? []).slice(0, 8);

  return (
    <div className="container-page py-8 lg:py-12">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
        New arrivals
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Just landed in store.</p>

      <div className="mt-8">
        {products.isLoading ? (
          <ProductGridSkeleton />
        ) : shown.length ? (
          <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No new arrivals yet"
            description="Freshly added sneakers will show up here first."
            action={
              <Button asChild className="rounded-full">
                <Link to="/shop">Browse all sneakers</Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
