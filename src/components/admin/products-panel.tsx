import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  adminProductsQuery,
  brandsQuery,
  categoriesQuery,
  primaryImage,
  type Product,
} from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { logActivity } from "@/lib/activity";
import { ProductForm } from "@/components/admin/product-form";
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

export function ProductsPanel({ userId }: { userId?: string }) {
  const queryClient = useQueryClient();
  const products = useQuery(adminProductsQuery());
  const brands = useQuery(brandsQuery());
  const categories = useQuery(categoriesQuery());
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const remove = useMutation({
    mutationFn: async (product: Product) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);
      if (error) throw error;
      if (userId) {
        void logActivity({
          actorId: userId,
          action: `Deleted product ${product.name}`,
          entity: "product",
          entityId: product.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not delete"),
  });

  const toggleActive = useMutation({
    mutationFn: async (product: Product) => {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !product.is_active })
        .eq("id", product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toast.error("Could not update visibility"),
  });

  const list = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products.data ?? []).filter((product) => {
      if (term && !product.name.toLowerCase().includes(term)) return false;
      if (brandFilter !== "all" && product.brand_id !== brandFilter) return false;
      if (statusFilter === "live" && !product.is_active) return false;
      if (statusFilter === "hidden" && product.is_active) return false;
      if (statusFilter === "featured" && !product.is_featured) return false;
      if (statusFilter === "out" && product.stock > 0) return false;
      return true;
    });
  }, [products.data, search, brandFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            className="h-10 rounded-full pl-9"
          />
        </div>
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="h-10 w-[160px] rounded-full">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {(brands.data ?? []).map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-[150px] rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="out">Out of stock</SelectItem>
          </SelectContent>
        </Select>
        <Button
          className="rounded-full"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add product
        </Button>
      </div>

      {products.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : list.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No products match these filters.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
          {list.map((product) => {
            const image = primaryImage(product);
            return (
              <li key={product.id} className="flex items-center gap-4 p-4 sm:p-5">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
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
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {product.brands?.name ?? "No brand"} ·{" "}
                    {formatPrice(product.selling_price)} · Stock {product.stock}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {!product.is_active && <Badge variant="secondary">Hidden</Badge>}
                    {product.is_featured && <Badge>Featured</Badge>}
                    {product.is_new && <Badge variant="outline">New</Badge>}
                    {product.stock === 0 && (
                      <Badge variant="destructive">Sold out</Badge>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-xs"
                    onClick={() => toggleActive.mutate(product)}
                  >
                    {product.is_active ? "Hide" : "Publish"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Edit ${product.name}`}
                    onClick={() => {
                      setEditing(product);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${product.name}`}
                    onClick={() => {
                      if (confirm(`Delete "${product.name}"?`))
                        remove.mutate(product);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ProductForm
        open={open}
        onOpenChange={setOpen}
        product={editing}
        brands={brands.data ?? []}
        categories={categories.data ?? []}
      />
    </div>
  );
}
