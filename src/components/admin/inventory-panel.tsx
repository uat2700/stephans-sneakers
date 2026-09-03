import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminProductsQuery, primaryImage, type Product } from "@/lib/catalog";
import { inventorySettingsQuery } from "@/lib/settings";
import { logActivity } from "@/lib/activity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SizeStock = { id: string; product_id: string; size: string; quantity: number };

const sizeStockQuery = {
  queryKey: ["size-stock"],
  queryFn: async (): Promise<SizeStock[]> => {
    const { data, error } = await supabase
      .from("product_size_stock")
      .select("id, product_id, size, quantity");
    if (error) throw error;
    return data ?? [];
  },
};

function SizeEditor({
  product,
  rows,
  userId,
  threshold,
}: {
  product: Product;
  rows: SizeStock[];
  userId?: string;
  threshold: number;
}) {
  const queryClient = useQueryClient();
  const sizes = product.sizes.length ? product.sizes : [];
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      sizes.map((size) => [
        size,
        String(rows.find((r) => r.size === size)?.quantity ?? 0),
      ]),
    ),
  );

  const save = useMutation({
    mutationFn: async () => {
      const payload = sizes.map((size) => ({
        product_id: product.id,
        size,
        quantity: Math.max(0, Number(draft[size] ?? 0) || 0),
      }));
      const { error } = await supabase
        .from("product_size_stock")
        .upsert(payload, { onConflict: "product_id,size" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["size-stock"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Stock updated");
      if (userId) {
        void logActivity({
          actorId: userId,
          action: `Updated size stock for ${product.name}`,
          entity: "product",
          entityId: product.id,
          details: draft,
        });
      }
    },
    onError: () => toast.error("Could not update stock"),
  });

  if (sizes.length === 0) {
    return (
      <p className="px-4 pb-4 text-xs text-muted-foreground">
        Add sizes to this product first, then stock can be tracked per size.
      </p>
    );
  }

  return (
    <div className="border-t border-border bg-surface/40 px-4 py-4">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
        {sizes.map((size) => {
          const quantity = Number(draft[size] ?? 0) || 0;
          return (
            <label key={size} className="block">
              <span className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {size}
                {quantity === 0 ? (
                  <span className="text-destructive">out</span>
                ) : quantity <= threshold ? (
                  <span className="text-gold">low</span>
                ) : null}
              </span>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={draft[size] ?? "0"}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, [size]: e.target.value }))
                }
                className="mt-1 h-9 rounded-xl text-sm"
              />
            </label>
          );
        })}
      </div>
      <Button
        size="sm"
        className="mt-3 rounded-full"
        disabled={save.isPending}
        onClick={() => save.mutate()}
      >
        {save.isPending ? "Saving…" : "Save stock"}
      </Button>
    </div>
  );
}

export function InventoryPanel({ userId }: { userId?: string }) {
  const products = useQuery(adminProductsQuery());
  const stock = useQuery(sizeStockQuery);
  const settings = useQuery(inventorySettingsQuery());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const threshold = settings.data?.low_stock_threshold ?? 3;

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products.data ?? []).filter((product) => {
      if (term && !product.name.toLowerCase().includes(term)) return false;
      if (filter === "low") return product.stock > 0 && product.stock <= threshold;
      if (filter === "out") return product.stock === 0;
      return true;
    });
  }, [products.data, search, filter, threshold]);

  if (products.isLoading || stock.isLoading) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const stockRows = stock.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            className="h-10 rounded-full pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-10 w-[180px] rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All products</SelectItem>
            <SelectItem value="low">Low stock</SelectItem>
            <SelectItem value="out">Out of stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        Low-stock alert triggers at {threshold} pairs or fewer. Set stock per size —
        sizes at 0 are hidden from customers automatically.
      </p>

      <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
        {rows.map((product) => {
          const image = primaryImage(product);
          const productRows = stockRows.filter((r) => r.product_id === product.id);
          const open = openId === product.id;
          const soldOutSizes = productRows.filter((r) => r.quantity === 0).length;
          return (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : product.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {image ? (
                    <img
                      src={image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {product.stock} in stock
                    {productRows.length
                      ? ` · ${productRows.length} sizes tracked`
                      : " · sizes not tracked yet"}
                    {soldOutSizes ? ` · ${soldOutSizes} sold out` : ""}
                  </p>
                </div>
                {product.stock === 0 ? (
                  <Badge variant="destructive" className="shrink-0 rounded-full">
                    Out
                  </Badge>
                ) : product.stock <= threshold ? (
                  <Badge className="shrink-0 rounded-full">
                    <AlertTriangle className="mr-1 h-3 w-3" /> Low
                  </Badge>
                ) : null}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>
              {open ? (
                <SizeEditor
                  product={product}
                  rows={productRows}
                  userId={userId}
                  threshold={threshold}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
