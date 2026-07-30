import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadProductImage } from "@/lib/storage";
import { slugify } from "@/lib/format";
import {
  COLOR_OPTIONS,
  GENDER_OPTIONS,
  SIZE_OPTIONS,
} from "@/lib/site";
import type { Brand, Category, Product } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Draft = {
  name: string;
  slug: string;
  description: string;
  brand_id: string;
  category_id: string;
  supplier_price: string;
  selling_price: string;
  compare_at_price: string;
  gender: string;
  stock: string;
  sizes: string[];
  colors: string[];
  tags: string;
  seo_title: string;
  seo_description: string;
  is_featured: boolean;
  is_new: boolean;
  is_active: boolean;
};

type DraftImage = { id?: string; url: string; alt: string | null };

const NONE = "__none__";

function emptyDraft(): Draft {
  return {
    name: "",
    slug: "",
    description: "",
    brand_id: "",
    category_id: "",
    supplier_price: "",
    selling_price: "",
    compare_at_price: "",
    gender: "unisex",
    stock: "0",
    sizes: [],
    colors: [],
    tags: "",
    seo_title: "",
    seo_description: "",
    is_featured: false,
    is_new: true,
    is_active: true,
  };
}

function toDraft(p: Product): Draft {
  return {
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    brand_id: p.brand_id ?? "",
    category_id: p.category_id ?? "",
    supplier_price: String(p.supplier_price ?? 0),
    selling_price: String(p.selling_price ?? 0),
    compare_at_price: p.compare_at_price === null ? "" : String(p.compare_at_price),
    gender: p.gender ?? "unisex",
    stock: String(p.stock ?? 0),
    sizes: p.sizes ?? [],
    colors: p.colors ?? [],
    tags: (p.tags ?? []).join(", "),
    seo_title: p.seo_title ?? "",
    seo_description: p.seo_description ?? "",
    is_featured: p.is_featured,
    is_new: p.is_new,
    is_active: p.is_active,
  };
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-muted-foreground hover:border-foreground/40",
      )}
    >
      {children}
    </button>
  );
}

export function ProductForm({
  open,
  onOpenChange,
  product,
  brands,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  brands: Brand[];
  categories: Category[];
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [images, setImages] = useState<DraftImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(product ? toDraft(product) : emptyDraft());
    setImages(
      product
        ? product.product_images.map((i) => ({ id: i.id, url: i.url, alt: i.alt }))
        : [],
    );
    setRemovedImageIds([]);
  }, [open, product]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggle = (key: "sizes" | "colors", value: string) =>
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value)
        ? d[key].filter((v) => v !== value)
        : [...d[key], value],
    }));

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(uploadProductImage));
      setImages((prev) => [...prev, ...urls.map((url) => ({ url, alt: null }))]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Image upload failed",
      );
    } finally {
      setUploading(false);
    }
  }

  const save = useMutation({
    mutationFn: async () => {
      const slug = draft.slug.trim() || slugify(draft.name);
      const payload = {
        name: draft.name.trim(),
        slug,
        description: draft.description.trim() || null,
        brand_id: draft.brand_id || null,
        category_id: draft.category_id || null,
        supplier_price: Number(draft.supplier_price || 0),
        selling_price: Number(draft.selling_price || 0),
        compare_at_price: draft.compare_at_price
          ? Number(draft.compare_at_price)
          : null,
        gender: draft.gender,
        stock: Number(draft.stock || 0),
        sizes: draft.sizes,
        colors: draft.colors,
        tags: draft.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        seo_title: draft.seo_title.trim() || null,
        seo_description: draft.seo_description.trim() || null,
        is_featured: draft.is_featured,
        is_new: draft.is_new,
        is_active: draft.is_active,
      };

      let productId = product?.id;
      if (productId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        productId = data.id;
      }

      if (removedImageIds.length) {
        const { error } = await supabase
          .from("product_images")
          .delete()
          .in("id", removedImageIds);
        if (error) throw error;
      }

      const newImages = images
        .map((img, index) => ({ ...img, position: index }))
        .filter((img) => !img.id);
      if (newImages.length) {
        const { error } = await supabase.from("product_images").insert(
          newImages.map((img) => ({
            product_id: productId!,
            url: img.url,
            alt: img.alt ?? draft.name,
            position: img.position,
          })),
        );
        if (error) throw error;
      }

      const existing = images.filter((img) => img.id);
      await Promise.all(
        existing.map((img, index) =>
          supabase
            .from("product_images")
            .update({ position: index })
            .eq("id", img.id!),
        ),
      );
    },
    onSuccess: () => {
      toast.success(product ? "Product updated" : "Product added");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  const markup =
    Number(draft.selling_price || 0) - Number(draft.supplier_price || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-tight">
            {product ? "Edit product" : "New product"}
          </DialogTitle>
        </DialogHeader>

        <form
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.name.trim()) return toast.error("Name is required");
            save.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={draft.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setDraft((d) => ({
                    ...d,
                    name,
                    slug: product ? d.slug : slugify(name),
                  }));
                }}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={draft.slug}
                onChange={(e) => set("slug", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Brand</Label>
              <Select
                value={draft.brand_id || NONE}
                onValueChange={(v) => set("brand_id", v === NONE ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No brand</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={draft.category_id || NONE}
                onValueChange={(v) => set("category_id", v === NONE ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Gender</Label>
              <Select value={draft.gender} onValueChange={(v) => set("gender", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g} className="capitalize">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="supplier">Supplier price</Label>
              <Input
                id="supplier"
                inputMode="decimal"
                value={draft.supplier_price}
                onChange={(e) => set("supplier_price", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="selling">Selling price</Label>
              <Input
                id="selling"
                inputMode="decimal"
                value={draft.selling_price}
                onChange={(e) => set("selling_price", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="compare">Compare at</Label>
              <Input
                id="compare"
                inputMode="decimal"
                value={draft.compare_at_price}
                onChange={(e) => set("compare_at_price", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                inputMode="numeric"
                value={draft.stock}
                onChange={(e) => set("stock", e.target.value)}
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Markup: GHS {markup.toLocaleString("en-GH")}
          </p>

          <div className="grid gap-2">
            <Label>Sizes</Label>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((s) => (
                <Chip
                  key={s}
                  active={draft.sizes.includes(s)}
                  onClick={() => toggle("sizes", s)}
                >
                  {s}
                </Chip>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Colours</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <Chip
                  key={c}
                  active={draft.colors.includes(c)}
                  onClick={() => toggle("colors", c)}
                >
                  {c}
                </Chip>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Images</Label>
            <div className="flex flex-wrap gap-3">
              {images.map((img, index) => (
                <div
                  key={img.id ?? img.url}
                  className="relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-muted"
                >
                  <img
                    src={img.url}
                    alt={img.alt ?? draft.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => {
                      if (img.id) setRemovedImageIds((p) => [...p, img.id!]);
                      setImages((p) => p.filter((_, i) => i !== index));
                    }}
                    className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-destructive shadow"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-foreground/40">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    void handleFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={draft.tags}
                onChange={(e) => set("tags", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seo-title">SEO title</Label>
              <Input
                id="seo-title"
                value={draft.seo_title}
                onChange={(e) => set("seo_title", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="seo-desc">SEO description</Label>
            <Textarea
              id="seo-desc"
              rows={2}
              value={draft.seo_description}
              onChange={(e) => set("seo_description", e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-6">
            {(
              [
                ["is_active", "Active"],
                ["is_featured", "Featured"],
                ["is_new", "New arrival"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <Switch
                  id={key}
                  checked={draft[key]}
                  onCheckedChange={(v) => set(key, v)}
                />
                <Label htmlFor={key} className="text-sm">
                  {label}
                </Label>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-full"
              disabled={save.isPending || uploading}
            >
              {save.isPending ? "Saving…" : "Save product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
