import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { adminOrdersQuery, customersQuery } from "@/lib/admin-orders";
import { formatPrice } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function CustomersPanel() {
  const customers = useQuery(customersQuery());
  const orders = useQuery(adminOrdersQuery());
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const allOrders = orders.data ?? [];
    return (customers.data ?? [])
      .map((customer) => {
        const own = allOrders.filter(
          (order) =>
            order.user_id === customer.id ||
            (customer.email && order.email === customer.email),
        );
        const spend = own
          .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
          .reduce((sum, o) => sum + o.total, 0);
        return {
          ...customer,
          orders: own.length,
          spend,
          lastOrder: own[0]?.created_at ?? null,
        };
      })
      .filter((row) => {
        if (!term) return true;
        return [row.full_name ?? "", row.email ?? "", row.phone ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) => b.spend - a.spend);
  }, [customers.data, orders.data, search]);

  if (customers.isLoading) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email or phone"
          className="h-10 rounded-full pl-9"
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No customers yet.
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {row.full_name ?? "Unnamed customer"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.email ?? "No email"}
                  {row.phone ? ` · ${row.phone}` : ""}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Joined {new Date(row.created_at).toLocaleDateString()}
                  {row.city ? ` · ${row.city}` : ""}
                  {row.region ? `, ${row.region}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4 text-right">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Orders
                  </p>
                  <p className="text-sm font-semibold">{row.orders}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Spent
                  </p>
                  <p className="text-sm font-semibold">{formatPrice(row.spend)}</p>
                </div>
                {row.lastOrder ? (
                  <Badge variant="secondary" className="rounded-full text-[10px]">
                    Last {new Date(row.lastOrder).toLocaleDateString()}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    No orders
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
