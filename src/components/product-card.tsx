import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Eye, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { discountPercent, formatPrice } from "@/lib/format";
import { primaryImage, reviewStatsQuery, type Product } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  onQuickView?: (product: Product) => void;
  className?: string;
};

export function ProductCard({ product, onQuickView, className }: Props) {
  const { addItem } = useCart();
  const wishlist = useWishlist();
  const stats = useQuery(reviewStatsQuery());
  const image = primaryImage(product);
  const discount = discountPercent(
    product.selling_price,
    product.compare_at_price,
  );
  const inStock = product.stock > 0;
  const lowStock = inStock && product.stock <= 3;
  const favourite = wishlist.has(product.id);
  const rating = stats.data?.[product.id] ?? null;


  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3 }}
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

      <div className="flex flex-1 flex-col gap-3 p-4 sm:gap-3.5 sm:p-5">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {product.brands?.name ?? "Sneaker"}
          </span>
          <span
            className={cn(
              "shrink-0 text-[11px] font-medium",
              !inStock
                ? "text-destructive"
                : lowStock
                  ? "text-gold"
                  : "text-whatsapp",
            )}
          >
            {!inStock
              ? "Sold out"
              : lowStock
                ? `Only ${product.stock} left`
                : "In stock"}
          </span>
        </div>

        <h3 className="line-clamp-2 min-h-[2.6em] text-[15px] font-semibold leading-snug sm:text-base">
          <Link to="/product/$slug" params={{ slug: product.slug }}>
            {product.name}
          </Link>
        </h3>

        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="flex shrink-0 gap-0.5" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < Math.round(rating?.average ?? 0) && "fill-current",
                )}
              />
            ))}
          </span>
          <span className="truncate">
            {rating
              ? `${rating.average.toFixed(1)} (${rating.count})`
              : "New listing"}
          </span>
        </div>

        {product.sizes.length ? (
          <p className="truncate text-[11px] font-medium text-muted-foreground">
            Sizes{" "}
            {(() => {
              const nums = product.sizes
                .map((s) => Number(s))
                .filter((n) => Number.isFinite(n))
                .sort((a, b) => a - b);
              if (!nums.length) return product.sizes.join(", ");
              const min = nums[0];
              const max = nums[nums.length - 1];
              return min === max ? `${min}` : `${min}–${max}`;
            })()}
          </p>
        ) : null}

        <div className="flex min-w-0 flex-nowrap items-baseline gap-2 overflow-hidden">
          <span className="whitespace-nowrap text-xl font-extrabold tracking-tight sm:text-2xl">
            {formatPrice(product.selling_price)}
          </span>
          {product.compare_at_price ? (
            <span className="whitespace-nowrap text-xs text-muted-foreground line-through sm:text-sm">
              {formatPrice(product.compare_at_price)}
            </span>
          ) : null}
          {discount ? (
            <span className="shrink-0 whitespace-nowrap text-[11px] font-bold text-whatsapp">
              -{discount}%
            </span>
          ) : null}
        </div>


        <div className="mt-auto pt-1.5">
          <Button
            type="button"
            size="sm"
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
            className="h-8 w-full gap-1.5 rounded-full text-[11px] font-semibold transition active:scale-[0.98] sm:text-xs"
          >
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" /> Add to cart
          </Button>
        </div>

      </div>
    </motion.article>
  );
}

