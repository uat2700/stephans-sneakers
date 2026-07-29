import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/format";
import { primaryImage, type Product } from "@/lib/catalog";
import { productMessage, whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export function QuickView({
  product,
  onOpenChange,
}: {
  product: Product | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { addItem } = useCart();
  const [size, setSize] = useState<string | null>(null);

  const open = Boolean(product);
  const chosen = size ?? product?.sizes[0] ?? null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSize(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-3xl overflow-hidden p-0">
        {product ? (
          <div className="grid gap-0 sm:grid-cols-2">
            <div className="aspect-square bg-surface">
              {primaryImage(product) ? (
                <img
                  src={primaryImage(product)!}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex flex-col gap-4 p-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {product.brands?.name ?? "Sneaker"}
                </p>
                <DialogTitle className="mt-1 text-xl font-bold">
                  {product.name}
                </DialogTitle>
                <p className="mt-2 text-lg font-bold">
                  {formatPrice(product.selling_price)}
                </p>
              </div>

              {product.description ? (
                <p className="line-clamp-4 text-sm text-muted-foreground">
                  {product.description}
                </p>
              ) : null}

              {product.sizes.length ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider">
                    Size
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={cn(
                          "h-9 min-w-11 rounded-lg border border-border px-3 text-sm font-medium transition",
                          chosen === s
                            ? "border-foreground bg-foreground text-background"
                            : "hover:border-foreground",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-auto grid gap-2">
                <Button
                  className="rounded-full"
                  disabled={product.stock <= 0}
                  onClick={() => {
                    addItem({
                      productId: product.id,
                      slug: product.slug,
                      name: product.name,
                      price: product.selling_price,
                      image: primaryImage(product),
                      size: chosen,
                      color: product.colors[0] ?? null,
                      quantity: 1,
                    });
                    toast.success("Added to cart", { description: product.name });
                    onOpenChange(false);
                  }}
                >
                  Add to cart
                </Button>
                <a
                  href={whatsappLink(
                    productMessage({
                      name: product.name,
                      price: product.selling_price,
                      size: chosen,
                    }),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-whatsapp text-sm font-semibold text-whatsapp-foreground"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Order on WhatsApp
                </a>
                <Button asChild variant="ghost" className="rounded-full">
                  <Link to="/product/$slug" params={{ slug: product.slug }}>
                    View full details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
