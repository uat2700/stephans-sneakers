import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { EmptyState } from "@/components/product-grid-skeleton";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";
import { cartMessage, whatsappLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Stephans Collection" },
      {
        name: "description",
        content:
          "Review the sneakers in your cart and check out with WhatsApp ordering or pay on delivery.",
      },
      { property: "og:title", content: "Your Cart — Stephans Collection" },
      {
        property: "og:description",
        content: "Review your sneakers and complete your order.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();

  if (!cart.items.length) {
    return (
      <div className="container-page py-12">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
          Your cart
        </h1>
        <div className="mt-8">
          <EmptyState
            title="Your cart is empty"
            description="Browse the collection and add a pair you love."
            action={
              <Button asChild className="rounded-full">
                <Link to="/shop">Start shopping</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8 lg:py-12">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
        Your cart
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {cart.count} {cart.count === 1 ? "item" : "items"}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ul className="space-y-4">
          {cart.items.map((item) => (
            <li
              key={item.id}
              className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-3xl border border-border bg-card p-4"
            >
              <div className="h-22 aspect-square overflow-hidden rounded-2xl bg-surface">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">
                      <Link to="/product/$slug" params={{ slug: item.slug }}>
                        {item.name}
                      </Link>
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[item.size && `Size ${item.size}`, item.color]
                        .filter(Boolean)
                        .join(" · ") || "Standard"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cart.removeItem(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-surface hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      type="button"
                      onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface"
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                      className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <span className="text-sm font-bold">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-3xl border border-border bg-card p-6 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em]">
            Order summary
          </h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatPrice(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="font-medium">
                {cart.deliveryFee === 0 ? "Free" : formatPrice(cart.deliveryFee)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-bold">{formatPrice(cart.total)}</dd>
            </div>
          </dl>

          {cart.subtotal < SITE.freeDeliveryFrom ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Spend {formatPrice(SITE.freeDeliveryFrom - cart.subtotal)} more for free
              delivery.
            </p>
          ) : null}

          <div className="mt-6 grid gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/checkout">Proceed to checkout</Link>
            </Button>
            <a
              href={whatsappLink(cartMessage(cart.items, cart.total))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-whatsapp text-sm font-semibold text-whatsapp-foreground transition hover:opacity-90"
            >
              <WhatsAppIcon className="h-4 w-4" /> Order on WhatsApp
            </a>
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/shop">Continue shopping</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
