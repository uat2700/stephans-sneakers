import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useSession } from "@/hooks/use-auth";
import {
  adminProductsQuery,
  brandsQuery,
  categoriesQuery,
  primaryImage,
  type Product,
} from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { ProductForm } from "@/components/admin/product-form";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { OrdersPanel } from "@/components/admin/orders-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — Stephans Collection" },
      {
        name: "description",
        content:
          "Admin dashboard for managing the Stephans Collection sneaker catalogue, stock and pricing.",
      },
      { property: "og:title", content: "Admin — Stephans Collection" },
      { property: "og:description", content: "Manage the sneaker catalogue." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

function Gate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const isAdmin = useIsAdmin(user);

  if (loading || (user && isAdmin === null)) {
    return (
      <div className="container-page flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-page max-w-md py-20 text-center">
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">
          Admin access
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in with your admin account to manage the catalogue.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container-page max-w-md py-20 text-center">
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">
          Not authorised
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This account doesn't have admin access yet.
        </p>
        <Button
          variant="outline"
          className="mt-6 rounded-full"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

function ProductsPanel() {
  const queryClient = useQueryClient();
  const products = useQuery(adminProductsQuery());
  const brands = useQuery(brandsQuery());
  const categories = useQuery(categoriesQuery());
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not delete"),
  });

  const list = products.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {list.length} product{list.length === 1 ? "" : "s"}
        </p>
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
          No products yet. Add your first sneaker to go live.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-3xl border border-border bg-card">
          {list.map((product) => {
            const image = primaryImage(product);
            return (
              <li
                key={product.id}
                className="flex items-center gap-4 p-4 sm:p-5"
              >
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
                    {!product.is_active && (
                      <Badge variant="secondary">Hidden</Badge>
                    )}
                    {product.is_featured && <Badge>Featured</Badge>}
                    {product.is_new && <Badge variant="outline">New</Badge>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
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
                        remove.mutate(product.id);
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

function Admin() {
  return (
    <Gate>
      <div className="container-page py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
              Admin dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage products, stock, pricing, brands and categories.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => supabase.auth.signOut()}
          >
            Sign out
          </Button>
        </div>

        <Tabs defaultValue="products" className="mt-8">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="taxonomy">Brands & categories</TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="mt-6">
            <ProductsPanel />
          </TabsContent>
          <TabsContent value="taxonomy" className="mt-6">
            <TaxonomyManager />
          </TabsContent>
        </Tabs>
      </div>
    </Gate>
  );
}
