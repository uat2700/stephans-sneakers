import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadProductImage } from "@/lib/storage";
import { slugify } from "@/lib/format";
import { identifySneakerImage } from "@/lib/ai-identify.functions";
import { brandsQuery, categoriesQuery } from "@/lib/catalog";
import { GENDER_OPTIONS, SIZE_OPTIONS } from "@/lib/site";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Row = {
  key: string;
  images: string[];
  status: "analysing" | "ready" | "failed";
  name: string;
  brandName: string;
  brandId: string | null;
  categoryId: string | null;
  gender: string;
  description: string;
  colors: string[];
  confidence: number;
  price: string;
  sizes: string[];
  stock: string;
};

const NONE = "__none__";

/** Colour words are ignored when matching, so colourways group as one product. */
const COLOR_WORDS = new Set([
  "black","white","red","blue","green","yellow","orange","purple","pink","brown",
  "grey","gray","beige","cream","ivory","tan","wheat","navy","teal","olive","khaki",
  "burgundy","maroon","gold","silver","bronze","charcoal","sand","stone","mint",
  "lilac","lavender","turquoise","coral","peach","plum","rust","mustard","offwhite",
  "multicolour","multicolor","multi","triple","panda","bred","oreo","chalk","smoke",
  "wolf","cool","light","dark","pale","deep","neon","volt","crimson","scarlet",
  "sail","platinum","anthracite","obsidian","onyx","natural","nubuck","colorway",
  "colourway",
]);

/** Model name with colour words stripped, e.g. "6-Inch Premium Boot". */
const baseName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !COLOR_WORDS.has(w))
    .join(" ")
    .trim();

/** Signature used to decide whether two photos are the same sneaker model. */
const signature = (brand: string, name: string) =>
  `${brand.trim().toLowerCase()}|${baseName(name)}`;


export function AiImport() {
  const queryClient = useQueryClient();
  const brands = useQuery(brandsQuery());
  const categories = useQuery(categoriesQuery());
  const identify = useServerFn(identifySneakerImage);
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [grouped, setGrouped] = useState(0);
  const [dragging, setDragging] = useState(false);

  const patch = (key: string, next: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...next } : r)));

  async function handleFiles(input: FileList | File[] | null) {
    const files = input ? Array.from(input).filter((f) => f.type.startsWith("image/")) : [];
    if (!files.length) return;
    setBusy(true);
    setGrouped(0);
    const brandNames = (brands.data ?? []).map((b) => b.name);
    const categoryNames = (categories.data ?? []).map((c) => c.name);

    for (const file of Array.from(files)) {
      const key = crypto.randomUUID();
      try {
        const imageUrl = await uploadProductImage(file);
        setRows((prev) => [
          ...prev,
          {
            key,
            images: [imageUrl],
            status: "analysing",
            name: "",
            brandName: "",
            brandId: null,
            categoryId: null,
            gender: "unisex",
            description: "",
            colors: [],
            confidence: 0,
            price: "",
            sizes: [],
            stock: "1",
          },
        ]);

        const result = await identify({
          data: { imageUrl, brands: brandNames, categories: categoryNames },
        });

        const matchedBrand = (brands.data ?? []).find(
          (b) => b.name.toLowerCase() === result.brand.trim().toLowerCase(),
        );
        const matchedCategory = (categories.data ?? []).find(
          (c) => c.name.toLowerCase() === result.category.trim().toLowerCase(),
        );

        const brandName = matchedBrand?.name ?? result.brand;
        const sig = signature(brandName, result.name);

        // Group this photo into an existing sneaker when it's the same model,
        // even if the colourway differs. Admin can still hit "Separate".
        let merged = false;
        setRows((prev) => {
          const target = baseName(result.name)
            ? prev.find(
                (r) =>
                  r.key !== key &&
                  r.status === "ready" &&
                  signature(r.brandName, r.name) === sig,
              )
            : undefined;
          if (!target) return prev;
          merged = true;
          return prev
            .filter((r) => r.key !== key)
            .map((r) =>
              r.key === target.key
                ? {
                    ...r,
                    images: [...r.images, imageUrl],
                    // keep the shorter (less colour-specific) product name
                    name:
                      result.name.trim() &&
                      result.name.trim().length < r.name.trim().length
                        ? result.name.trim()
                        : r.name,
                    colors: Array.from(new Set([...r.colors, ...result.colors])),
                  }
                : r,
            );
        });


        if (merged) {
          setGrouped((n) => n + 1);
          continue;
        }

        patch(key, {
          status: "ready",
          name: result.name,
          brandName,
          brandId: matchedBrand?.id ?? null,
          categoryId: matchedCategory?.id ?? null,
          gender: GENDER_OPTIONS.includes(result.gender) ? result.gender : "unisex",
          description: result.description,
          colors: result.colors,
          confidence: result.confidence,
        });
      } catch (error) {
        patch(key, { status: "failed" });
        toast.error(
          error instanceof Error ? error.message : `Could not analyse ${file.name}`,
        );
      }
    }

    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const removeImage = (key: string, url: string) =>
    setRows((prev) =>
      prev
        .map((r) =>
          r.key === key ? { ...r, images: r.images.filter((i) => i !== url) } : r,
        )
        .filter((r) => r.images.length > 0),
    );

  const splitImage = (key: string, url: string) =>
    setRows((prev) => {
      const source = prev.find((r) => r.key === key);
      if (!source || source.images.length < 2) return prev;
      return [
        ...prev.map((r) =>
          r.key === key ? { ...r, images: r.images.filter((i) => i !== url) } : r,
        ),
        { ...source, key: crypto.randomUUID(), images: [url] },
      ];
    });

  const publish = useMutation({
    mutationFn: async () => {
      const ready = rows.filter((r) => r.status === "ready");
      if (!ready.length) throw new Error("Nothing to publish yet");

      const missing = ready.filter((r) => !r.name.trim() || !Number(r.price));
      if (missing.length)
        throw new Error("Every sneaker needs a name and a selling price");

      // Create any brand the AI found that isn't in the catalogue yet.
      const brandCache = new Map<string, string>(
        (brands.data ?? []).map((b) => [b.name.toLowerCase(), b.id]),
      );
      for (const row of ready) {
        const label = row.brandName.trim();
        if (!label || row.brandId) continue;
        const existing = brandCache.get(label.toLowerCase());
        if (existing) {
          row.brandId = existing;
          continue;
        }
        const { data, error } = await supabase
          .from("brands")
          .insert({ name: label, slug: slugify(label) })
          .select("id")
          .single();
        if (error) throw error;
        brandCache.set(label.toLowerCase(), data.id);
        row.brandId = data.id;
      }

      for (const row of ready) {
        const name = row.name.trim();
        const { data, error } = await supabase
          .from("products")
          .insert({
            name,
            slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
            description: row.description || null,
            brand_id: row.brandId,
            category_id: row.categoryId,
            supplier_price: 0,
            selling_price: Number(row.price),
            gender: row.gender,
            stock: Number(row.stock || 0),
            sizes: row.sizes,
            colors: row.colors,
            is_active: true,
            is_new: true,
          })
          .select("id")
          .single();
        if (error) throw error;

        const { error: imageError } = await supabase.from("product_images").insert(
          row.images.map((url, index) => ({
            product_id: data.id,
            url,
            alt: name,
            position: index,
          })),
        );
        if (imageError) throw imageError;
      }
    },
    onSuccess: () => {
      toast.success("Sneakers published to the store");
      setRows([]);
      setGrouped(0);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Could not publish"),
  });

  const applyToAll = (field: "price" | "sizes" | "stock", from: Row) =>
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        [field]: field === "sizes" ? [...from.sizes] : from[field],
      })),
    );

  const readyCount = rows.filter((r) => r.status === "ready").length;

  return (
    <div>
      <div className="rounded-3xl border border-dashed border-border bg-card p-6 text-center">
        <Sparkles className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-3 font-display text-lg font-extrabold uppercase tracking-tight">
          AI photo import
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Upload sneaker photos and AI will detect the brand and product name for
          each pair. Photos of the same sneaker are grouped into one product
          automatically — you only set the price and sizes.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          className="mt-5 rounded-full"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-1.5 h-4 w-4" />
          )}
          {busy ? "Analysing photos…" : "Upload sneaker photos"}
        </Button>
        {grouped > 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {grouped} photo{grouped === 1 ? "" : "s"} grouped with a matching sneaker.
          </p>
        ) : null}
      </div>

      {rows.length ? (
        <div className="mt-6 space-y-4">
          {rows.map((row) => (
            <div
              key={row.key}
              className="rounded-3xl border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex gap-4">
                <div className="w-24 shrink-0 space-y-2">
                  {row.images.map((url, index) => (
                    <div
                      key={url}
                      className="group relative h-24 w-24 overflow-hidden rounded-2xl bg-muted"
                    >
                      <img
                        src={url}
                        alt={row.name || "Uploaded sneaker"}
                        className="h-full w-full object-cover"
                      />
                      {row.images.length > 1 ? (
                        <>
                          <button
                            type="button"
                            aria-label="Remove this photo"
                            onClick={() => removeImage(row.key, url)}
                            className="absolute right-1 top-1 rounded-full bg-background/90 p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          {index > 0 ? (
                            <button
                              type="button"
                              onClick={() => splitImage(row.key, url)}
                              className="absolute inset-x-1 bottom-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold"
                            >
                              Separate
                            </button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  ))}
                  {row.images.length > 1 ? (
                    <p className="text-center text-[11px] text-muted-foreground">
                      {row.images.length} photos grouped
                    </p>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  {row.status === "analysing" ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Identifying sneaker…
                    </p>
                  ) : row.status === "failed" ? (
                    <p className="text-sm text-destructive">
                      Could not identify this photo. Remove it and try again.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label htmlFor={`name-${row.key}`}>Product name</Label>
                        <Input
                          id={`name-${row.key}`}
                          value={row.name}
                          onChange={(e) => patch(row.key, { name: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label>Brand</Label>
                        <Select
                          value={row.brandId ?? NONE}
                          onValueChange={(v) => {
                            if (v === NONE) {
                              patch(row.key, { brandId: null });
                              return;
                            }
                            const brand = (brands.data ?? []).find((b) => b.id === v);
                            patch(row.key, {
                              brandId: v,
                              brandName: brand?.name ?? row.brandName,
                            });
                          }}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Pick a brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>
                              {row.brandName
                                ? `Create "${row.brandName}"`
                                : "No brand"}
                            </SelectItem>
                            {(brands.data ?? []).map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!row.brandId && row.brandName ? (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            AI detected <strong>{row.brandName}</strong> — it will be
                            added as a new brand.
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={row.categoryId ?? NONE}
                          onValueChange={(v) =>
                            patch(row.key, { categoryId: v === NONE ? null : v })
                          }
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Pick a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>No category</SelectItem>
                            {(categories.data ?? []).map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`price-${row.key}`}>Selling price (GHS)</Label>
                        <div className="mt-1.5 flex gap-2">
                          <Input
                            id={`price-${row.key}`}
                            inputMode="decimal"
                            value={row.price}
                            onChange={(e) => patch(row.key, { price: e.target.value })}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => applyToAll("price", row)}
                          >
                            All
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`stock-${row.key}`}>Stock</Label>
                        <div className="mt-1.5 flex gap-2">
                          <Input
                            id={`stock-${row.key}`}
                            inputMode="numeric"
                            value={row.stock}
                            onChange={(e) => patch(row.key, { stock: e.target.value })}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => applyToAll("stock", row)}
                          >
                            All
                          </Button>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label>Sizes</Label>
                          <button
                            type="button"
                            className="text-xs font-semibold underline underline-offset-4"
                            onClick={() => applyToAll("sizes", row)}
                          >
                            Apply sizes to all
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {SIZE_OPTIONS.map((size) => {
                            const active = row.sizes.includes(size);
                            return (
                              <button
                                key={size}
                                type="button"
                                aria-pressed={active}
                                onClick={() =>
                                  patch(row.key, {
                                    sizes: active
                                      ? row.sizes.filter((s) => s !== size)
                                      : [...row.sizes, size],
                                  })
                                }
                                className={cn(
                                  "rounded-full border px-3 py-1 text-xs font-semibold transition",
                                  active
                                    ? "border-foreground bg-foreground text-background"
                                    : "border-border hover:border-foreground",
                                )}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                        {row.colors.map((c) => (
                          <Badge key={c} variant="outline">
                            {c}
                          </Badge>
                        ))}
                        <Badge variant="secondary">
                          AI confidence {Math.round(row.confidence * 100)}%
                        </Badge>
                        {row.images.length > 1 ? (
                          <Badge variant="secondary">
                            {row.images.length} photos
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Remove sneaker"
                  className="shrink-0"
                  onClick={() =>
                    setRows((prev) => prev.filter((r) => r.key !== row.key))
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setRows([])}
            >
              Clear all
            </Button>
            <Button
              className="rounded-full"
              disabled={publish.isPending || busy}
              onClick={() => publish.mutate()}
            >
              {publish.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : null}
              Publish {readyCount} sneaker{readyCount === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
