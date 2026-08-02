import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { discountPercent, formatPrice } from "@/lib/format";
import { primaryImage, type Product } from "@/lib/catalog";
import { productMessage, whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  onQuickView?: (product: Product) => void;
  className?: string;
};

export function ProductCard({ product, onQuickView, className }: Props) {
  const { addItem } = useCart();
  const wishlist = useWishlist();
  const image = primaryImage(product);
  const discount = discountPercent(
    product.selling_price,
    product.compare_at_price,
  );
  const inStock = product.stock > 0;
  const favourite = wishlist.has(product.id);

  return (
    <article
      className={cn(
        "card-lift group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card",
        className,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface">

        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          aria-label={product.name}
        >
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-muted-foreground">
              No image
            </div>
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2">
          {discount ? (
            <Badge className="pointer-events-auto rounded-full bg-foreground px-2.5 text-[11px] font-semibold text-background">
              -{discount}%
            </Badge>
          ) : null}
          {product.is_new ? (
            <Badge
              variant="secondary"
              className="pointer-events-auto rounded-full px-2.5 text-[11px] font-semibold"
            >
              New
            </Badge>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => wishlist.toggle(product.id)}
          aria-label={favourite ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={favourite}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:scale-105"
        >
          <Heart
            className={cn("h-4 w-4", favourite && "fill-current")}
            aria-hidden="true"
          />
        </button>

        {onQuickView ? (
          <div className="absolute inset-x-3 bottom-3 hidden md:block">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onQuickView(product)}
              className="w-full translate-y-3 rounded-full opacity-0 shadow-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
            >
              <Eye className="h-4 w-4" aria-hidden="true" /> Quick view
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {product.brands?.name ?? "Sneaker"}
          </span>
          <span
            className={cn(
              "shrink-0 text-[11px] font-medium",
              inStock ? "text-whatsapp" : "text-destructive",
            )}
          >
            {inStock ? "In stock" : "Sold out"}
          </span>
        </div>

        <h3 className="line-clamp-2 text-base font-semibold leading-snug">
          <Link to="/product/$slug" params={{ slug: product.slug }}>
            {product.name}
          </Link>
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">
            {formatPrice(product.selling_price)}
          </span>
          {product.compare_at_price ? (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          ) : null}
        </div>

        {product.sizes.length ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Available sizes">
            {product.sizes.slice(0, 6).map((size) => (
              <li
                key={size}
                className="rounded-md bg-surface px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {size}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto grid gap-2 pt-1">
          <Button
            type="button"
            disabled={!inStock}
            onClick={() => {
              addItem({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price: product.selling_price,
                image,
                size: product.sizes[0] ?? null,
                color: product.colors[0] ?? null,
                quantity: 1,
              });
              toast.success("Added to cart", { description: product.name });
            }}
            className="w-full rounded-full"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" /> Add to cart
          </Button>
          <a
            href={whatsappLink(
              productMessage({
                name: product.name,
                price: product.selling_price,
                size: product.sizes[0],
              }),
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-full bg-whatsapp text-sm font-semibold text-whatsapp-foreground transition hover:opacity-90"
          >
            <WhatsAppIcon className="h-4 w-4" /> Order on WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}
