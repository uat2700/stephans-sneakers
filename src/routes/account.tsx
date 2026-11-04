import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgeCheck,
  Camera,
  ChevronRight,
  Clock3,
  Heart,
  Info,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  Settings,
  ShieldAlert,
  Sparkles,
  Store,
  TicketPercent,
  Truck,
  UserRound,
} from "lucide-react";
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
import { uploadAvatar } from "@/lib/avatar";
import { deleteMyAccount } from "@/lib/account.functions";
import { formatPrice } from "@/lib/format";
import { REGIONS } from "@/lib/site";
import { activeCouponsQuery } from "@/lib/store-settings";

export const Route = createFileRoute("/account")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Account — Stephans Collection" },
      {
        name: "description",
        content:
          "Manage your profile, photo, login details and your orders at Stephans Collection.",
      },
      { property: "og:title", content: "My Account — Stephans Collection" },
      {
        property: "og:description",
        content: "Manage your profile and track your orders.",
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
  avatar_url: string | null;
};

const empty: Profile = {
  full_name: "",
  phone: "",
  address: "",
  city: "",
  region: "Greater Accra",
  avatar_url: null,
};

type Section = "profile" | "orders" | "settings";

const ORDER_SHORTCUTS = [
  { label: "Pending", status: "pending", Icon: Clock3 },
  { label: "Processing", status: "processing", Icon: Package },
  { label: "Shipped", status: "shipped", Icon: Truck },
  { label: "Delivered", status: "delivered", Icon: PackageCheck },
] as const;

const SERVICE_LINKS = [
  { label: "Contact Us", to: "/contact", Icon: MessageCircle },
  { label: "About Us", to: "/about", Icon: Info },
  { label: "Wishlist", to: "/wishlist", Icon: Heart },
  { label: "Shop", to: "/shop", Icon: Store },
  { label: "New Arrivals", to: "/new-arrivals", Icon: Sparkles },
  { label: "Brands", to: "/brands", Icon: BadgeCheck },
] as const;

function Account() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile>(empty);
  const [section, setSection] = useState<Section>("orders");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [deleteText, setDeleteText] = useState("");
  const [busy, setBusy] = useState<null | "password" | "email" | "delete" | "photo">(
    null,
  );

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone, address, city, region, avatar_url")
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
          avatar_url: data.avatar_url ?? null,
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

  const wishlistCount = useQuery({
    queryKey: ["my-wishlist-count", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { count, error } = await supabase
        .from("wishlist")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const coupons = useQuery({ ...activeCouponsQuery(), enabled: Boolean(user) });

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
        avatar_url: profile.avatar_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Details saved");
      void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  async function onPickPhoto(file: File | undefined) {
    if (!file || !user) return;
    setBusy("photo");
    try {
      const url = await uploadAvatar(user.id, file);
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, email: user.email, avatar_url: url });
      if (error) throw error;
      set("avatar_url", url);
      void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy("password");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated");
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email");
    const { error } = await supabase.auth.updateUser(
      { email: newEmail.trim() },
      { emailRedirectTo: window.location.origin },
    );
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewEmail("");
    toast.success("Check your new inbox to confirm the change");
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  async function removeAccount() {
    setBusy("delete");
    try {
      await deleteMyAccount();
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      toast.success("Your account has been deleted");
      void navigate({ to: "/", replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete your account",
      );
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="pb-28" aria-busy="true" aria-label="Loading your account">
        <div className="bg-whatsapp">
          <div className="container-page max-w-3xl pb-16 pt-8">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 animate-pulse rounded-full bg-whatsapp-foreground/20" />
              <div className="grid gap-2">
                <div className="h-6 w-40 animate-pulse rounded bg-whatsapp-foreground/20" />
                <div className="h-4 w-56 animate-pulse rounded bg-whatsapp-foreground/20" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="mx-auto h-10 w-14 animate-pulse rounded bg-whatsapp-foreground/20" />
              ))}
            </div>
          </div>
        </div>
        <div className="container-page max-w-3xl">
          <div className="-mt-10 h-32 animate-pulse rounded-3xl border border-border bg-card" />
          <div className="mt-4 h-24 animate-pulse rounded-3xl border border-border bg-card" />
        </div>
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

  const initial = (profile.full_name || user.email || "?").charAt(0).toUpperCase();
  const filteredOrders = statusFilter
    ? (orders.data ?? []).filter((o) => o.status === statusFilter)
    : (orders.data ?? []);

  const openOrders = (status: string | null) => {
    setStatusFilter(status);
    setSection("orders");
  };

  return (
    <div className="pb-28">
      {/* Green profile header */}
      <header className="bg-whatsapp text-whatsapp-foreground">
        <div className="container-page max-w-3xl pb-16 pt-8">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="relative">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={`${profile.full_name || "Customer"} profile photo`}
                    className="h-20 w-20 rounded-full border-2 border-whatsapp-foreground/30 object-cover"
                  />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-whatsapp-foreground/30 bg-whatsapp-foreground/10 font-display text-2xl font-bold">
                    {initial}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  aria-label="Change profile photo"
                  className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-border bg-background text-foreground shadow-sm"
                  disabled={busy === "photo"}
                >
                  <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    void onPickPhoto(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </div>
              <div>
                <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
                  {profile.full_name || "My account"}
                </h1>
                <p className="mt-0.5 text-sm opacity-80">{user.email}</p>
                <button
                  type="button"
                  onClick={() => setSection("profile")}
                  className="mt-1 inline-flex items-center gap-1 text-sm font-medium underline-offset-2 hover:underline"
                >
                  Edit your account <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSection("settings")}
                aria-label="Account settings"
                className="grid h-10 w-10 place-items-center rounded-full border border-whatsapp-foreground/30"
              >
                <Settings className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                className="grid h-10 w-10 place-items-center rounded-full border border-whatsapp-foreground/30"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-3 text-center">
            <button type="button" onClick={() => openOrders(null)} className="grid gap-0.5">
              <span className="font-display text-2xl font-extrabold">
                {orders.data?.length ?? 0}
              </span>
              <span className="text-xs opacity-80">Orders</span>
            </button>
            <Link to="/wishlist" className="grid gap-0.5">
              <span className="font-display text-2xl font-extrabold">
                {wishlistCount.data ?? 0}
              </span>
              <span className="text-xs opacity-80">Wishlist</span>
            </Link>
            <div className="grid gap-0.5">
              <span className="font-display text-2xl font-extrabold">
                {coupons.data?.length ?? 0}
              </span>
              <span className="text-xs opacity-80">Coupons</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container-page max-w-3xl">
        {/* My Orders card */}
        <section className="-mt-10 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight">
              My orders
            </h2>
            <button
              type="button"
              onClick={() => openOrders(null)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              All orders <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {ORDER_SHORTCUTS.map(({ label, status, Icon }) => {
              const count = (orders.data ?? []).filter((o) => o.status === status).length;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => openOrders(status)}
                  className="grid justify-items-center gap-2 rounded-2xl p-2 hover:bg-muted"
                >
                  <span className="relative grid h-12 w-12 place-items-center rounded-full border border-border bg-muted">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {count > 0 ? (
                      <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-whatsapp px-1 text-[10px] font-bold text-whatsapp-foreground">
                        {count}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs">{label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Coupon strip */}
        {coupons.data?.length ? (
          <section className="mt-4 flex items-center gap-3 rounded-3xl border border-border bg-card p-4">
            <TicketPercent className="h-6 w-6 shrink-0 text-whatsapp" aria-hidden="true" />
            <p className="text-sm">
              <span className="font-bold">{coupons.data[0].code}</span>
              <span className="text-muted-foreground">
                {" "}— save {coupons.data[0].discount_type === "percent"
                  ? `${coupons.data[0].value}%`
                  : formatPrice(coupons.data[0].value)}{" "}
                at checkout
              </span>
            </p>
          </section>
        ) : null}

        {/* Official Service card */}
        <section className="mt-4 rounded-3xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">
            Official service
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {SERVICE_LINKS.map(({ label, to, Icon }) => (
              <Link
                key={label}
                to={to}
                className="grid justify-items-center gap-2 rounded-2xl p-2 hover:bg-muted"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full border border-border bg-muted">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-center text-xs">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Section tabs */}
        <div className="mt-6 grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted p-1">
          {(
            [
              ["orders", "Orders", Package],
              ["profile", "Details", UserRound],
              ["settings", "Settings", Settings],
            ] as const
          ).map(([value, label, Icon]) => (
            <Button
              key={value}
              type="button"
              variant={section === value ? "default" : "ghost"}
              className="gap-2 rounded-md px-2 text-xs sm:text-sm"
              onClick={() => setSection(value)}
            >
              <Icon className="h-4 w-4" /> {label}
            </Button>
          ))}
        </div>

        <div className="mt-5 grid gap-8 lg:mt-8">
          {section === "profile" ? (
            <form
              className="grid h-fit gap-5 rounded-3xl border border-border bg-card p-5 sm:p-6"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                  Delivery details
                </h2>
              </div>
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
                className="sticky bottom-[4.75rem] z-10 rounded-md shadow-lg shadow-background/40 lg:static lg:shadow-none"
                disabled={save.isPending}
              >
                {save.isPending ? "Saving…" : "Save details"}
              </Button>
            </form>
          ) : null}

          {section === "orders" ? (
            <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                  {statusFilter ? `${statusFilter} orders` : "Order history"}
                </h2>
                {statusFilter ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => setStatusFilter(null)}
                  >
                    Show all
                  </Button>
                ) : null}
              </div>
              {orders.isLoading ? (
                <p className="mt-4 text-sm text-muted-foreground">Loading orders…</p>
              ) : !filteredOrders.length ? (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    {statusFilter
                      ? `No ${statusFilter} orders right now.`
                      : "You haven't placed an order yet."}
                  </p>
                  <Button asChild className="mt-5 rounded-full">
                    <Link to="/shop">Start shopping</Link>
                  </Button>
                </div>
              ) : (
                <ul className="mt-4 grid gap-4">
                  {filteredOrders.map((order) => (
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
          ) : null}

          {section === "settings" ? (
            <div className="grid gap-6">
              <form
                onSubmit={changePassword}
                className="grid gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6"
              >
                <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                  Change password
                </h2>
                <div className="grid gap-2">
                  <Label htmlFor="acc-new-password">New password</Label>
                  <Input
                    id="acc-new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="acc-confirm-password">Confirm new password</Label>
                  <Input
                    id="acc-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={busy === "password"} className="rounded-md">
                  {busy === "password" ? "Saving…" : "Update password"}
                </Button>
              </form>

              <form
                onSubmit={changeEmail}
                className="grid gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6"
              >
                <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                  Change email
                </h2>
                <p className="text-sm text-muted-foreground">
                  Current email: {user.email}
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="acc-new-email">New email</Label>
                  <Input
                    id="acc-new-email"
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={busy === "email"} className="rounded-md">
                  {busy === "email" ? "Sending…" : "Send confirmation"}
                </Button>
              </form>

              <section className="grid gap-4 rounded-3xl border border-destructive/40 bg-card p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <ShieldAlert
                    className="h-5 w-5 text-destructive"
                    aria-hidden="true"
                  />
                  <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                    Delete my account
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  This permanently removes your profile, cart, wishlist and reviews and
                  signs you out. Past orders stay in our records for accounting.
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
                  <Input
                    id="delete-confirm"
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    placeholder="DELETE"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  className="rounded-md"
                  disabled={deleteText.trim().toUpperCase() !== "DELETE" || busy === "delete"}
                  onClick={removeAccount}
                >
                  {busy === "delete" ? "Deleting…" : "Delete my account"}
                </Button>
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
