import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { REGIONS } from "@/lib/site";

export const Route = createFileRoute("/account")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Account — Stephans Collection" },
      {
        name: "description",
        content:
          "Manage your delivery details and track your sneaker orders at Stephans Collection.",
      },
      { property: "og:title", content: "My Account — Stephans Collection" },
      {
        property: "og:description",
        content: "Track your sneaker orders and update delivery details.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Account,
});

type Profile = {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  region: string;
};

const empty: Profile = {
  full_name: "",
  phone: "",
  address: "",
  city: "",
  region: "Greater Accra",
};

function Account() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>(empty);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone, address, city, region")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setProfile({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          region: data.region ?? "Greater Accra",
        });
      });
  }, [user]);

  const orders = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, status, payment_status, total, created_at, order_items(id, product_name, size, quantity, unit_price)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").upsert({
        id: user!.id,
        email: user!.email,
        full_name: profile.full_name.trim() || null,
        phone: profile.phone.trim() || null,
        address: profile.address.trim() || null,
        city: profile.city.trim() || null,
        region: profile.region,
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Details saved"),
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  if (loading) {
    return (
      <div className="container-page max-w-xl py-16 text-center text-sm text-muted-foreground">
        Loading your account…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-page max-w-xl py-16 text-center">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
          My account
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in to save your delivery details and track every order you place.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild className="rounded-full">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/shop">Continue shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-4xl py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
            My account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Button
          variant="outline"
          className="gap-2 rounded-full"
          onClick={async () => {
            await supabase.auth.signOut();
            void navigate({ to: "/" });
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <form
          className="grid h-fit gap-5 rounded-3xl border border-border bg-card p-6"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">
            Delivery details
          </h2>
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => set("full_name", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone (WhatsApp)</Label>
            <Input
              id="phone"
              inputMode="tel"
              value={profile.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={profile.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="city">City / town</Label>
              <Input
                id="city"
                value={profile.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Region</Label>
              <Select
                value={profile.region}
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
          <Button
            type="submit"
            className="rounded-full"
            disabled={save.isPending}
          >
            {save.isPending ? "Saving…" : "Save details"}
          </Button>
        </form>

        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">
            Order history
          </h2>
          {orders.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading orders…</p>
          ) : !orders.data?.length ? (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                You haven't placed an order yet.
              </p>
              <Button asChild className="mt-5 rounded-full">
                <Link to="/shop">Start shopping</Link>
              </Button>
            </div>
          ) : (
            <ul className="mt-4 grid gap-4">
              {orders.data.map((order) => (
                <li
                  key={order.id}
                  className="rounded-2xl border border-border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold uppercase">
                      {order.order_number}
                    </span>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-GH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <ul className="mt-3 grid gap-1 text-sm">
                    {order.order_items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-3">
                        <span className="text-muted-foreground">
                          {item.product_name}
                          {item.size ? ` · ${item.size}` : ""} × {item.quantity}
                        </span>
                        <span>
                          {formatPrice(Number(item.unit_price) * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-bold">
                    <span>Total</span>
                    <span>{formatPrice(Number(order.total))}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
