import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { brandsQuery, productsQuery } from "@/lib/catalog";
import { EmptyState } from "@/components/product-grid-skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/brands")({
  head: () => ({
    meta: [
      { title: "Sneaker Brands — Stephans Collection" },
      {
        name: "description",
        content:
          "Explore every sneaker brand stocked at Stephans Collection and shop by your favourite label.",
      },
      { property: "og:title", content: "Sneaker Brands — Stephans Collection" },
      { property: "og:description", content: "Shop sneakers by brand." },
    ],
  }),
  component: BrandsPage,
});

function BrandsPage() {
  const brands = useQuery(brandsQuery());
  const products = useQuery(productsQuery());

  const count = (slug: string) =>
    (products.data ?? []).filter((p) => p.brands?.slug === slug).length;

  return (
    <div className="container-page py-8 lg:py-12">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
        Brands
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Shop your favourite labels.
      </p>

      <div className="mt-8">
        {brands.data?.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {brands.data.map((b) => (
              <Link
                key={b.id}
                to="/shop"
                search={{ brand: b.slug }}
                className="card-lift flex flex-col items-center justify-center gap-2 rounded-3xl border border-border bg-card p-8 text-center"
              >
                {b.logo_url ? (
                  <img
                    src={b.logo_url}
                    alt={b.name}
                    loading="lazy"
                    className="h-10 object-contain"
                  />
                ) : null}
                <span className="font-display text-lg font-extrabold uppercase">
                  {b.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {count(b.slug)} products
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No brands yet"
            description="Brands you add in the admin dashboard will appear here."
            action={
              <Button asChild className="rounded-full">
                <Link to="/admin">Go to admin</Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
