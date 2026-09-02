import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Phone, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  adminOrdersQuery,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type AdminOrder,
} from "@/lib/admin-orders";
import { REGIONS } from "@/lib/site";
import { formatPrice } from "@/lib/format";
import { logActivity } from "@/lib/activity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function statusVariant(status: string) {
  if (status === "delivered") return "default" as const;
  if (status === "cancelled" || status === "refunded") return "destructive" as const;
  return "secondary" as const;
}

function OrderNotes({ order }: { order: AdminOrder }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(order.admin_notes ?? "");

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("orders")
        .update({ admin_notes: value })
        .eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Internal note saved");
    },
    onError: () => toast.error("Could not save note"),
  });

  return (
    <div className="mt-4 border-t border-border pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Internal note
      </p>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Only visible to your team"
        className="mt-2 min-h-[64px] rounded-xl text-sm"
      />
      <Button
        size="sm"
        variant="outline"
        className="mt-2 rounded-full"
        disabled={save.isPending || value === (order.admin_notes ?? "")}
        onClick={() => save.mutate()}
      >
        {save.isPending ? "Saving…" : "Save note"}
      </Button>
    </div>
  );
}

export function OrdersPanel({ userId }: { userId?: string }) {
  const queryClient = useQueryClient();
  const orders = useQuery(adminOrdersQuery());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");
  const [region, setRegion] = useState("all");
  const [days, setDays] = useState("all");

  const update = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: { status?: string; payment_status?: string };
      label: string;
    }) => {
      const { error } = await supabase.from("orders").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order updated");
      if (userId) {
        void logActivity({
          actorId: userId,
          action: `Updated order ${variables.label}`,
          entity: "order",
          entityId: variables.id,
          details: variables.patch,
        });
      }
    },
    onError: () => toast.error("Could not update order"),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const cutoff =
      days === "all" ? null : new Date(Date.now() - Number(days) * 86_400_000);
    return (orders.data ?? []).filter((order) => {
      if (status !== "all" && order.status !== status) return false;
      if (payment !== "all" && order.payment_status !== payment) return false;
      if (region !== "all" && order.region !== region) return false;
      if (cutoff && new Date(order.created_at) < cutoff) return false;
      if (!term) return true;
      const haystack = [
        order.order_number,
        order.full_name,
        order.phone,
        order.email ?? "",
        ...order.order_items.map((item) => item.product_name),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [orders.data, search, status, payment, region, days]);

  if (orders.isLoading) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <div className="relative sm:col-span-2 xl:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order ID, name, phone, product"
            className="h-10 rounded-full pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 rounded-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={payment} onValueChange={setPayment}>
          <SelectTrigger className="h-10 rounded-full">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger className="h-10 rounded-full">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All regions</SelectItem>
            {REGIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="h-10 rounded-full">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any time</SelectItem>
            <SelectItem value="1">Last 24 hours</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} order{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-10 text-center">
          <p className="font-display text-lg font-bold uppercase tracking-tight">
            No orders match
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try clearing the filters or search term.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o) => (
            <li key={o.id} className="rounded-3xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-extrabold uppercase tracking-tight">
                    #{o.order_number}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString()} ·{" "}
                    {o.payment_method === "cod" ? "Pay on delivery" : o.payment_method}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant(o.status)} className="capitalize">
                    {o.status}
                  </Badge>
                  <Select
                    value={o.status}
                    onValueChange={(next) =>
                      update.mutate({
                        id: o.id,
                        patch: { status: next },
                        label: `#${o.order_number} → ${next}`,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 w-[160px] rounded-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={o.payment_status}
                    onValueChange={(next) =>
                      update.mutate({
                        id: o.id,
                        patch: { payment_status: next },
                        label: `#${o.order_number} payment → ${next}`,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 w-[150px] rounded-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          Payment: {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="text-sm">
                  <p className="font-semibold">{o.full_name}</p>
                  <a
                    href={`tel:${o.phone}`}
                    className="mt-0.5 inline-flex items-center gap-1.5 text-muted-foreground"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {o.phone}
                  </a>
                  <p className="mt-1 text-muted-foreground">
                    {o.address}, {o.city}, {o.region}
                  </p>
                  {o.notes ? (
                    <p className="mt-1 text-muted-foreground">
                      Customer note: {o.notes}
                    </p>
                  ) : null}
                </div>

                <div>
                  <ul className="space-y-1.5 text-sm">
                    {o.order_items.map((it) => (
                      <li key={it.id} className="flex justify-between gap-3">
                        <span className="min-w-0 truncate text-muted-foreground">
                          {it.quantity}× {it.product_name}
                          {it.size ? ` · ${it.size}` : ""}
                          {it.color ? ` · ${it.color}` : ""}
                        </span>
                        <span className="shrink-0 font-medium">
                          {formatPrice(it.unit_price * it.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{formatPrice(o.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery</span>
                      <span>{formatPrice(o.delivery_fee)}</span>
                    </div>
                    <div className="flex justify-between font-display font-extrabold uppercase">
                      <span>Total</span>
                      <span>{formatPrice(o.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <OrderNotes order={o} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
