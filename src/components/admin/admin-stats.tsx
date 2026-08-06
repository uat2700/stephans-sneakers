import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Package,
  ShoppingBag,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminProductsQuery } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

type OrderRow = { total: number; status: string };

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "gold" | "warn";
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <span
          className={
            tone === "gold"
              ? "grid h-8 w-8 place-items-center rounded-xl bg-gold/15 text-gold"
              : tone === "warn"
                ? "grid h-8 w-8 place-items-center rounded-xl bg-destructive/10 text-destructive"
                : "grid h-8 w-8 place-items-center rounded-xl bg-surface text-muted-foreground"
          }
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function AdminStats() {
  const products = useQuery(adminProductsQuery());
  const orders = useQuery({
    queryKey: ["admin-order-stats"],
    queryFn: async (): Promise<OrderRow[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("total, status");
      if (error) throw error;
      return (data ?? []).map((o) => ({
        total: Number(o.total),
        status: o.status,
      }));
    },
  });

  const list = products.data ?? [];
  const live = list.filter((p) => p.is_active).length;
  const lowStock = list.filter((p) => p.stock > 0 && p.stock <= 3).length;
  const outOfStock = list.filter((p) => p.stock === 0).length;
  const orderRows = orders.data ?? [];
  const pending = orderRows.filter((o) => o.status === "pending").length;
  const revenue = orderRows
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Products"
        value={String(list.length)}
        hint={`${live} live${list.length - live > 0 ? ` · ${list.length - live} hidden` : ""}`}
        icon={Package}
      />
      <StatCard
        label="Orders"
        value={String(orderRows.length)}
        hint={pending > 0 ? `${pending} awaiting confirmation` : "All handled"}
        icon={ShoppingBag}
      />
      <StatCard
        label="Revenue"
        value={formatPrice(revenue)}
        hint="Excluding cancelled orders"
        icon={TrendingUp}
        tone="gold"
      />
      <StatCard
        label="Stock alerts"
        value={String(lowStock + outOfStock)}
        hint={`${lowStock} low · ${outOfStock} sold out`}
        icon={AlertTriangle}
        tone={lowStock + outOfStock > 0 ? "warn" : "default"}
      />
    </div>
  );
}
