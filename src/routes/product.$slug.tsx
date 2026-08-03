import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "@/components/product-card";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";

import { discountPercent, formatPrice } from "@/lib/format";
import { productQuery, productsQuery } from "@/lib/catalog";
import { productMessage, whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const title = params.slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return {
      meta: [
        { title: `${title} — Stephans Collection` },
        {
          name: "description",
          content: `Buy ${title} at Stephans Collection. Premium sneakers with fast delivery in Ghana and easy WhatsApp ordering.`,
        },
        { property: "og:title", content: `${title} — Stephans Collection` },
        {
          property: "og:description",
          content: `Buy ${title} with fast delivery across Ghana.`,
        },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useQuery(productQuery(slug));
  const { data: all } = useQuery(productsQuery());
  const { addItem } = useCart();
  const wishlist = useWishlist();

  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(false);
  const recentIds = useRecentlyViewed(product?.id);


  if (isLoading) {
    return (
      <div className="container-page grid gap-8 py-10 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl font-extrabold uppercase">
          Sneaker not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This product may have sold out or been removed.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/shop">Back to shop</Link>
        </Button>
      </div>
    );
  }

  const images = product.product_images;
  const image = images[activeImage]?.url ?? null;
  const discount = discountPercent(product.selling_price, product.compare_at_price);
  const chosenSize = size ?? product.sizes[0] ?? null;
  const chosenColor = color ?? product.colors[0] ?? null;
  const related = (all ?? [])
    .filter((p) => p.id !== product.id && p.brand_id === product.brand_id)
    .slice(0, 4);

  return (
    <div className="container-page py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>{" "}
        /{" "}
        <Link to="/shop" className="hover:text-foreground">
          Shop
        </Link>{" "}
        / <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          {/* Mobile: swipeable gallery */}
          <div className="sm:hidden">
            {images.length ? (
              <>
                <div
                  className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    setActiveImage(
                      Math.round(el.scrollLeft / Math.max(1, el.clientWidth)),
                    );
                  }}
                >
                  {images.map((img, i) => (
                    <div
                      key={img.id}
                      className="relative aspect-square w-full shrink-0 snap-center overflow-hidden rounded-3xl border border-border bg-surface"
                    >
                      <img
                        src={img.url}
                        alt={img.alt ?? product.name}
                        loading={i === 0 ? "eager" : "lazy"}
                        className="h-full w-full object-cover"
                      />
                      {discount && i === 0 ? (
                        <Badge className="absolute left-4 top-4 rounded-full bg-foreground text-background">
                          -{discount}%
                        </Badge>
                      ) : null}
                    </div>
                  ))}
                </div>
                {images.length > 1 ? (
                  <div className="mt-3 flex justify-center gap-1.5">
                    {images.map((img, i) => (
                      <span
                        key={img.id}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          i === activeImage
                            ? "w-5 bg-foreground"
                            : "w-1.5 bg-border",
                        )}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="grid aspect-square place-items-center rounded-3xl border border-border bg-surface text-sm text-muted-foreground">
                No image
              </div>
            )}
          </div>

          {/* Desktop: main image with zoom + thumbnails */}
          <div className="hidden sm:block">
            <div
              className={cn(
                "relative aspect-square overflow-hidden rounded-3xl border border-border bg-surface",
                image && "cursor-zoom-in",
              )}
              onClick={() => image && setZoom((z) => !z)}
            >
              {image ? (
                <img
                  src={image}
                  alt={images[activeImage]?.alt ?? product.name}
                  className={cn(
                    "h-full w-full object-cover transition-transform duration-500",
                    zoom && "scale-150 cursor-zoom-out",
                  )}
                />
              ) : (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">
                  No image
                </div>
              )}
              {discount ? (
                <Badge className="absolute left-4 top-4 rounded-full bg-foreground text-background">
                  -{discount}%
                </Badge>
              ) : null}
            </div>

            {images.length > 1 ? (
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => {
                      setActiveImage(i);
                      setZoom(false);
                    }}
                    aria-label={`View image ${i + 1}`}
                    className={cn(
                      "h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-surface",
                      i === activeImage ? "border-foreground" : "border-transparent",
                    )}
                  >
                    <img
                      src={img.url}
                      alt={img.alt ?? ""}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>


        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {product.brands?.name ?? "Sneaker"}
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold uppercase leading-tight tracking-tight sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-bold">
              {formatPrice(product.selling_price)}
            </span>
            {product.compare_at_price ? (
              <span className="text-base text-muted-foreground line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-sm font-medium">
            {product.stock > 0 ? (
              <span className="text-whatsapp">In stock · {product.stock} left</span>
            ) : (
              <span className="text-destructive">Sold out</span>
            )}
          </p>

          {product.sizes.length ? (
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]">
                Select size
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={cn(
                      "h-11 min-w-14 rounded-xl border px-4 text-sm font-semibold transition",
                      chosenSize === s
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {product.colors.length ? (
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]">
                Colour
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "h-10 rounded-xl border px-4 text-sm font-medium transition",
                      chosenColor === c
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-border">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
                className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => wishlist.toggle(product.id)}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold hover:border-foreground"
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  wishlist.has(product.id) && "fill-current",
                )}
                aria-hidden="true"
              />
              {wishlist.has(product.id) ? "Saved" : "Save"}
            </button>
          </div>

          <div className="mt-6 grid gap-3">
            <Button
              size="lg"
              className="rounded-full"
              disabled={product.stock <= 0}
              onClick={() => {
                addItem({
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: product.selling_price,
                  image: images[0]?.url ?? null,
                  size: chosenSize,
                  color: chosenColor,
                  quantity: qty,
                });
                toast.success("Added to cart", { description: product.name });
              }}
            >
              Add to cart
            </Button>
            <a
              href={whatsappLink(
                productMessage({
                  name: product.name,
                  price: product.selling_price,
                  size: chosenSize,
                }),
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-whatsapp text-sm font-semibold text-whatsapp-foreground transition hover:opacity-90"
            >
              <WhatsAppIcon className="h-4 w-4" /> Order on WhatsApp
            </a>
          </div>

          <div className="mt-6 grid gap-3 rounded-2xl bg-surface p-4 text-sm">
            <p className="flex items-center gap-2">
              <Truck className="h-4 w-4" aria-hidden="true" /> Delivery in 1–3 days
              nationwide
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Pay on delivery
              available
            </p>
          </div>

          <Accordion type="single" collapsible className="mt-6">
            <AccordionItem value="description">
              <AccordionTrigger>Description</AccordionTrigger>
              <AccordionContent className="whitespace-pre-line text-muted-foreground">
                {product.description ||
                  "Premium quality sneaker, carefully selected and inspected before delivery."}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="delivery">
              <AccordionTrigger>Delivery & returns</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Accra deliveries arrive within 24 hours. Other regions take 2–3 working
                days. Wrong size? Message us on WhatsApp within 24 hours of delivery for
                an exchange.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.length ? (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight">
            You may also like
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      {recentlyViewed.length ? (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight">
            Recently viewed
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-muted-foreground">
              {chosenSize ? `Size ${chosenSize}` : "Select a size"}
            </p>
            <p className="truncate text-base font-bold leading-tight">
              {formatPrice(product.selling_price)}
            </p>
          </div>
          <Button
            className="h-11 shrink-0 rounded-full px-4 text-xs"
            disabled={product.stock <= 0}
            onClick={() => {
              addItem({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price: product.selling_price,
                image: images[0]?.url ?? null,
                size: chosenSize,
                color: chosenColor,
                quantity: qty,
              });
              toast.success("Added to cart", { description: product.name });
            }}
          >
            Add to cart
          </Button>
          <a
            href={whatsappLink(
              productMessage({
                name: product.name,
                price: product.selling_price,
                size: chosenSize,
              }),
            )}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Order on WhatsApp"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground"
          >
            <WhatsAppIcon className="h-5 w-5" />
          </a>
        </div>
      </div>
    </div>

  );
}
