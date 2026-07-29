import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
import { EmptyState, ProductGridSkeleton } from "@/components/product-grid-skeleton";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/use-wishlist";
import { productsQuery } from "@/lib/catalog";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — Stephans Collection" },
      {
        name: "description",
        content: "The sneakers you saved for later at Stephans Collection.",
      },
      { property: "og:title", content: "Wishlist — Stephans Collection" },
      { property: "og:description", content: "Sneakers you saved for later." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { ids } = useWishlist();
  const products = useQuery(productsQuery());
  const saved = (products.data ?? []).filter((p) => ids.includes(p.id));

  return (
    <div className="container-page py-8 lg:py-12">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
        Wishlist
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {saved.length} saved {saved.length === 1 ? "pair" : "pairs"}
      </p>

      <div className="mt-8">
        {products.isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : saved.length ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {saved.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing saved yet"
            description="Tap the heart on any sneaker to keep it here for later."
            action={
              <Button asChild className="rounded-full">
                <Link to="/shop">Browse sneakers</Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
