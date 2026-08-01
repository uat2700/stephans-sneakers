import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = [
  "pending",
  "confirmed",
  "delivered",
  "cancelled",
] as const;

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  size: string | null;
  color: string | null;
};

type Order = {
  id: string;
  order_number: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  notes: string | null;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  order_items: OrderItem[];
};

const ordersQuery = {
  queryKey: ["admin-orders"],
  queryFn: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `id, order_number, full_name, phone, address, city, region, notes, status,
         payment_method, payment_status, subtotal, delivery_fee, total, created_at,
         order_items ( id, product_name, quantity, unit_price, size, color )`,
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Order[];
  },
};

function statusVariant(status: string) {
  if (status === "delivered") return "default" as const;
  if (status === "cancelled") return "destructive" as const;
  return "secondary" as const;
}

export function OrdersPanel() {
  const queryClient = useQueryClient();
  const orders = useQuery(ordersQuery);

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not update"),
  });

  if (orders.isLoading) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!orders.data?.length) {
    return (
      <div className="rounded-3xl border border-border bg-card p-10 text-center">
        <p className="font-display text-lg font-bold uppercase tracking-tight">
          No orders yet
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Orders placed at checkout will appear here.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.data.map((o) => (
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
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant(o.status)} className="capitalize">
                {o.status}
              </Badge>
              <Select
                value={o.status}
                onValueChange={(status) => setStatus.mutate({ id: o.id, status })}
              >
                <SelectTrigger className="h-9 w-[150px] rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
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
                <p className="mt-1 text-muted-foreground">Note: {o.notes}</p>
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
                      {formatPrice(Number(it.unit_price) * it.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(Number(o.subtotal))}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span>{formatPrice(Number(o.delivery_fee))}</span>
                </div>
                <div className="flex justify-between font-display font-extrabold uppercase">
                  <span>Total</span>
                  <span>{formatPrice(Number(o.total))}</span>
                </div>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
