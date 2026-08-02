import { Instagram } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { primaryImage, type Product } from "@/lib/catalog";
import { SITE } from "@/lib/site";

export function InstagramGallery({ products }: { products: Product[] }) {
  const tiles = products
    .map((p) => ({ product: p, image: primaryImage(p) }))
    .filter((t) => t.image)
    .slice(0, 8);

  if (!tiles.length) return null;

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
            On the feed
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fresh pairs from {SITE.name}. Tag us to feature.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold">
          <Instagram className="h-4 w-4" aria-hidden="true" /> @stephanscollection
        </span>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tiles.map(({ product, image }) => (
          <li key={product.id}>
            <Link
              to="/product/$slug"
              params={{ slug: product.slug }}
              className="group block aspect-square overflow-hidden rounded-2xl bg-surface"
            >
              <img
                src={image!}
                alt={product.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
