import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BadgeCent,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { adminOrdersQuery, customersQuery } from "@/lib/admin-orders";
import { adminProductsQuery, brandsQuery, categoriesQuery } from "@/lib/catalog";
import { inventorySettingsQuery } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type RangeKey =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "month"
  | "last_month"
  | "custom";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "custom", label: "Custom" },
];

function startOfDay(d: Date) {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

function resolveRange(key: RangeKey, from: string, to: string) {
  const now = new Date();
  const today = startOfDay(now);
  switch (key) {
    case "today":
      return { start: today, end: now };
    case "yesterday": {
      const start = new Date(today);
      start.setDate(start.getDate() - 1);
      return { start, end: today };
    }
    case "7d": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start, end: now };
    }
    case "30d": {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { start, end: now };
    }
    case "month":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    case "last_month":
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 1),
      };
    case "custom": {
      const start = from ? startOfDay(new Date(from)) : new Date(0);
      const end = to ? new Date(new Date(to).setHours(23, 59, 59, 999)) : now;
      return { start, end };
    }
  }
}

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
  icon: typeof Package;
  tone?: "default" | "gold" | "warn";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "grid h-8 w-8 place-items-center rounded-xl",
            tone === "gold"
              ? "bg-gold/15 text-gold"
              : tone === "warn"
                ? "bg-destructive/10 text-destructive"
                : "bg-surface text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold tracking-tight">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="font-display text-sm font-extrabold uppercase tracking-tight">
        {title}
      </p>
      {subtitle ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      ) : null}
      <div className="mt-4 h-56 w-full">{children}</div>
    </div>
  );
}

const PIE_COLORS = ["#c9a84c", "#8c8c8c", "#5c5c5c", "#e0c877", "#3d3d3d", "#a88f3e"];

const axisProps = {
  stroke: "currentColor",
  tick: { fontSize: 11 },
  className: "text-muted-foreground",
} as const;

const tooltipStyle = {
  background: "hsl(var(--card, 0 0% 8%))",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
  color: "inherit",
} as const;

export function DashboardPanel({ showFinancials }: { showFinancials: boolean }) {
  const [range, setRange] = useState<RangeKey>("30d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const orders = useQuery(adminOrdersQuery());
  const products = useQuery(adminProductsQuery());
  const customers = useQuery(customersQuery());
  const brands = useQuery(brandsQuery());
  const categories = useQuery(categoriesQuery());
  const inventory = useQuery(inventorySettingsQuery());

  const { start, end } = resolveRange(range, from, to);
  const threshold = inventory.data?.low_stock_threshold ?? 3;

  const stats = useMemo(() => {
    const all = orders.data ?? [];
    const inRange = all.filter((o) => {
      const at = new Date(o.created_at);
      return at >= start && at <= end;
    });
    const paidLike = inRange.filter(
      (o) => o.status !== "cancelled" && o.status !== "refunded",
    );
    const revenue = paidLike.reduce((sum, o) => sum + o.total, 0);

    const today = startOfDay(new Date());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const sumSince = (since: Date) =>
      all
        .filter(
          (o) =>
            new Date(o.created_at) >= since &&
            o.status !== "cancelled" &&
            o.status !== "refunded",
        )
        .reduce((sum, o) => sum + o.total, 0);

    const supplierById = new Map(
      (products.data ?? []).map((p) => [p.id, Number(p.supplier_price ?? 0)]),
    );
    const profit = paidLike.reduce((sum, order) => {
      const cost = order.order_items.reduce(
        (c, item) => c + (supplierById.get(item.product_id ?? "") ?? 0) * item.quantity,
        0,
      );
      return sum + (order.subtotal - cost);
    }, 0);

    // Time series
    const days = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1,
    );
    const buckets = new Map<string, { revenue: number; orders: number }>();
    for (let i = 0; i < Math.min(days, 60); i += 1) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      buckets.set(day.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
    }
    for (const order of paidLike) {
      const key = order.created_at.slice(0, 10);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.revenue += order.total;
        bucket.orders += 1;
      }
    }
    const series = [...buckets.entries()].map(([date, value]) => ({
      date: date.slice(5),
      revenue: Math.round(value.revenue),
      orders: value.orders,
    }));

    // Best sellers / brand / category
    const bySeller = new Map<string, number>();
    const byBrand = new Map<string, number>();
    const byCategory = new Map<string, number>();
    for (const order of paidLike) {
      for (const item of order.order_items) {
        const value = item.unit_price * item.quantity;
        bySeller.set(item.product_name, (bySeller.get(item.product_name) ?? 0) + item.quantity);
        const brandId = item.products?.brand_id ?? "unknown";
        byBrand.set(brandId, (byBrand.get(brandId) ?? 0) + value);
        const categoryId = item.products?.category_id ?? "unknown";
        byCategory.set(categoryId, (byCategory.get(categoryId) ?? 0) + value);
      }
    }
    const brandName = (id: string) =>
      (brands.data ?? []).find((b) => b.id === id)?.name ?? "Other";
    const categoryName = (id: string) =>
      (categories.data ?? []).find((c) => c.id === id)?.name ?? "Other";

    const bestSellers = [...bySeller.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, units]) => ({
        name: name.length > 18 ? `${name.slice(0, 18)}…` : name,
        units,
      }));
    const brandSales = [...byBrand.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, value]) => ({ name: brandName(id), value: Math.round(value) }));
    const categorySales = [...byCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, value]) => ({ name: categoryName(id), value: Math.round(value) }));

    // Customer growth
    const growthMap = new Map<string, number>();
    for (const customer of customers.data ?? []) {
      const key = customer.created_at.slice(0, 7);
      growthMap.set(key, (growthMap.get(key) ?? 0) + 1);
    }
    let running = 0;
    const growth = [...growthMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => {
        running += count;
        return { month, customers: running };
      });

    const list = products.data ?? [];
    return {
      revenue,
      profit,
      orderCount: inRange.length,
      pending: inRange.filter((o) => ["pending", "confirmed", "processing"].includes(o.status)).length,
      completed: inRange.filter((o) => o.status === "delivered").length,
      cancelled: inRange.filter((o) => ["cancelled", "refunded"].includes(o.status)).length,
      aov: paidLike.length ? revenue / paidLike.length : 0,
      todaySales: sumSince(today),
      weekSales: sumSince(weekAgo),
      monthSales: sumSince(monthStart),
      customerCount: (customers.data ?? []).length,
      productCount: list.length,
      lowStock: list.filter((p) => p.stock > 0 && p.stock <= threshold).length,
      outOfStock: list.filter((p) => p.stock === 0).length,
      series,
      bestSellers,
      brandSales,
      categorySales,
      growth,
    };
  }, [orders.data, products.data, customers.data, brands.data, categories.data, start, end, threshold]);

  const loading = orders.isLoading || products.isLoading;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((option) => (
          <Button
            key={option.key}
            size="sm"
            variant={range === option.key ? "default" : "outline"}
            className="rounded-full text-xs"
            onClick={() => setRange(option.key)}
          >
            {option.label}
          </Button>
        ))}
        {range === "custom" ? (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 w-[150px] rounded-full"
              aria-label="From date"
            />
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 w-[150px] rounded-full"
              aria-label="To date"
            />
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {showFinancials ? (
              <StatCard
                label="Revenue"
                value={formatPrice(stats.revenue)}
                hint={`Avg order ${formatPrice(stats.aov)}`}
                icon={TrendingUp}
                tone="gold"
              />
            ) : null}
            {showFinancials ? (
              <StatCard
                label="Est. profit"
                value={formatPrice(stats.profit)}
                hint="Selling − supplier price"
                icon={BadgeCent}
                tone="gold"
              />
            ) : null}
            <StatCard
              label="Orders"
              value={String(stats.orderCount)}
              hint={`${stats.pending} open · ${stats.completed} delivered · ${stats.cancelled} cancelled`}
              icon={ShoppingBag}
            />
            <StatCard
              label="Customers"
              value={String(stats.customerCount)}
              hint="Registered accounts"
              icon={Users}
            />
            <StatCard
              label="Products"
              value={String(stats.productCount)}
              hint={`${stats.outOfStock} sold out`}
              icon={Package}
            />
            <StatCard
              label="Stock alerts"
              value={String(stats.lowStock + stats.outOfStock)}
              hint={`Low stock at ≤ ${threshold} pairs`}
              icon={AlertTriangle}
              tone={stats.lowStock + stats.outOfStock > 0 ? "warn" : "default"}
            />
            {showFinancials ? (
              <>
                <StatCard
                  label="Today"
                  value={formatPrice(stats.todaySales)}
                  icon={TrendingUp}
                />
                <StatCard
                  label="Last 7 days"
                  value={formatPrice(stats.weekSales)}
                  icon={TrendingUp}
                />
                <StatCard
                  label="This month"
                  value={formatPrice(stats.monthSales)}
                  icon={TrendingUp}
                />
              </>
            ) : null}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {showFinancials ? (
              <ChartCard title="Revenue over time" subtitle="Selected period">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.series}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c9a84c" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#c9a84c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                    <XAxis dataKey="date" {...axisProps} />
                    <YAxis {...axisProps} width={48} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#c9a84c"
                      fill="url(#rev)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            ) : null}

            <ChartCard title="Orders over time" subtitle="Selected period">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.series}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                  <XAxis dataKey="date" {...axisProps} />
                  <YAxis allowDecimals={false} {...axisProps} width={32} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="orders" fill="#c9a84c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Best-selling sneakers" subtitle="Units sold">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.bestSellers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                  <XAxis type="number" allowDecimals={false} {...axisProps} />
                  <YAxis type="category" dataKey="name" width={110} {...axisProps} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="units" fill="#c9a84c" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Sales by category" subtitle="Revenue share">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categorySales}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {stats.categorySales.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Sales by brand" subtitle="Revenue">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.brandSales}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                  <XAxis dataKey="name" {...axisProps} />
                  <YAxis {...axisProps} width={48} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#c9a84c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Customer growth" subtitle="Cumulative sign-ups">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.growth}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                  <XAxis dataKey="month" {...axisProps} />
                  <YAxis allowDecimals={false} {...axisProps} width={32} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="customers"
                    stroke="#c9a84c"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
