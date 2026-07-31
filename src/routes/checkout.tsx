import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/hooks/use-cart";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { REGIONS } from "@/lib/site";
import { cartMessage, whatsappLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Stephans Collection" },
      {
        name: "description",
        content:
          "Complete your sneaker order with delivery details, WhatsApp confirmation and pay-on-delivery across Ghana.",
      },
      { property: "og:title", content: "Checkout — Stephans Collection" },
      {
        property: "og:description",
        content: "Enter delivery details and confirm your sneaker order.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

type Form = {
  full_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  region: string;
  notes: string;
};

const empty: Form = {
  full_name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  region: "Greater Accra",
  notes: "",
};

function Checkout() {
  const cart = useCart();
  const navigate = useNavigate();
  const { user } = useSession();
  const [form, setForm] = useState<Form>(empty);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, email: f.email || user.email || "" }));
    supabase
      .from("profiles")
      .select("full_name, phone, address, city, region")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setForm((f) => ({
          ...f,
          full_name: f.full_name || data.full_name || "",
          phone: f.phone || data.phone || "",
          address: f.address || data.address || "",
          city: f.city || data.city || "",
          region: data.region || f.region,
        }));
      });
  }, [user]);

  const place = useMutation({
    mutationFn: async () => {
      const message = cartMessage(cart.items, cart.total);

      if (user) {
        const { data: order, error } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || null,
            address: form.address.trim(),
            city: form.city.trim(),
            region: form.region,
            notes: form.notes.trim() || null,
            subtotal: cart.subtotal,
            delivery_fee: cart.deliveryFee,
            total: cart.total,
          })
          .select("id, order_number")
          .single();
        if (error) throw error;

        const { error: itemsError } = await supabase.from("order_items").insert(
          cart.items.map((i) => ({
            order_id: order.id,
            product_id: i.productId,
            product_name: i.name,
            size: i.size,
            color: i.color,
            unit_price: i.price,
            quantity: i.quantity,
          })),
        );
        if (itemsError) throw itemsError;

        return { message: `${message}\n\nOrder ref: ${order.order_number}` };
      }

      return { message };
    },
    onSuccess: ({ message }) => {
      window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
      cart.clear();
      toast.success("Order placed — confirm it on WhatsApp");
      void navigate({ to: user ? "/account" : "/shop" });
    },
    onError: (error: unknown) =>
      toast.error(
        error instanceof Error ? error.message : "Could not place your order",
      ),
  });

  if (cart.items.length === 0 && !place.isPending) {
    return (
      <div className="container-page max-w-xl py-16 text-center">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
          Checkout
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your cart is empty. Add a pair to continue.
        </p>
        <Button asChild className="mt-8 rounded-full">
          <Link to="/shop">Shop sneakers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page max-w-4xl py-12">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
        Checkout
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pay on delivery. We confirm every order on WhatsApp before dispatch. Card
        payments (Paystack) coming soon.
      </p>

      <form
        className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.full_name.trim() || !form.phone.trim())
            return toast.error("Name and phone are required");
          if (!form.address.trim() || !form.city.trim())
            return toast.error("Delivery address and city are required");
          place.mutate();
        }}
      >
        <div className="grid gap-5 rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">
            Delivery details
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone (WhatsApp)</Label>
              <Input
                id="phone"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Delivery address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="city">City / town</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Region</Label>
              <Select
                value={form.region}
                onValueChange={(v) => set("region", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Order notes (optional)</Label>
            <Textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          {!user && (
            <p className="text-xs text-muted-foreground">
              <Link to="/auth" className="font-medium underline">
                Sign in
              </Link>{" "}
              to save this order to your account and track it later.
            </p>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">
            Summary
          </h2>
          <ul className="mt-4 grid gap-3 text-sm">
            {cart.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {i.name}
                  {i.size ? ` · ${i.size}` : ""} × {i.quantity}
                </span>
                <span className="font-medium">
                  {formatPrice(i.price * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span>
                {cart.deliveryFee === 0 ? "Free" : formatPrice(cart.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(cart.total)}</span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={place.isPending}
            className="mt-6 h-11 w-full gap-2 rounded-full bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
          >
            <WhatsAppIcon className="h-4 w-4" />
            {place.isPending ? "Placing order…" : "Place order on WhatsApp"}
          </Button>
          <Button
            asChild
            variant="outline"
            className="mt-3 w-full rounded-full"
          >
            <Link to="/cart">Back to cart</Link>
          </Button>
        </aside>
      </form>
    </div>
  );
}
