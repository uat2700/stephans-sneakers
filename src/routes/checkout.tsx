import { createFileRoute, Link } from "@tanstack/react-router";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/format";
import { cartMessage, whatsappLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Stephans Collection" },
      {
        name: "description",
        content:
          "Complete your sneaker order with WhatsApp confirmation and pay-on-delivery. Card payments coming soon.",
      },
      { property: "og:title", content: "Checkout — Stephans Collection" },
      { property: "og:description", content: "Complete your sneaker order." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const cart = useCart();

  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
        Checkout
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Card payments (Paystack) are coming soon. For now, confirm your order on
        WhatsApp and pay on delivery.
      </p>

      <div className="mt-8 rounded-3xl border border-border bg-card p-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Items</span>
          <span className="font-medium">{cart.count}</span>
        </div>
        <div className="mt-3 flex justify-between text-base">
          <span className="font-semibold">Total</span>
          <span className="font-bold">{formatPrice(cart.total)}</span>
        </div>

        <div className="mt-6 grid gap-3">
          <a
            href={whatsappLink(cartMessage(cart.items, cart.total))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-whatsapp text-sm font-semibold text-whatsapp-foreground"
          >
            <WhatsAppIcon className="h-4 w-4" /> Confirm order on WhatsApp
          </a>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/cart">Back to cart</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
