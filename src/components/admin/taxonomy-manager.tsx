import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { brandsQuery, categoriesQuery, type Brand } from "@/lib/catalog";
import { slugify } from "@/lib/format";
import { uploadProductImage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function BrandImageButton({ brand }: { brand: Brand }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadProductImage(file);
      const { error } = await supabase
        .from("brands")
        .update({ logo_url: url })
        .eq("id", brand.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success(`${brand.name} image updated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <button
        type="button"
        aria-label={`Change image for ${brand.name}`}
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:border-foreground"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : brand.logo_url ? (
          <img
            src={brand.logo_url}
            alt={brand.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
      </button>
    </>
  );
}

function Manager({
  table,
  title,
}: {
  table: "brands" | "categories";
  title: string;
}) {
  const queryClient = useQueryClient();
  const brands = useQuery(brandsQuery());
  const categories = useQuery(categoriesQuery());
  const items: Array<{ id: string; name: string }> =
    (table === "brands" ? brands.data : categories.data) ?? [];
  const [name, setName] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      const value = name.trim();
      if (!value) throw new Error("Name is required");
      const { error } = await supabase
        .from(table)
        .insert({ name: value, slug: slugify(value) });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: [table] });
      toast.success(`${title} added`);
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not add"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] });
      toast.success("Deleted");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not delete"),
  });

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <h2 className="font-display text-lg font-bold uppercase tracking-tight">
        {title}
      </h2>
      {table === "brands" ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Tap a thumbnail to change the picture shown on the homepage brand
          slider.
        </p>
      ) : null}
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate();
        }}
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`New ${title.toLowerCase().replace(/s$/, "")}`}
        />
        <Button type="submit" className="rounded-full" disabled={add.isPending}>
          Add
        </Button>
      </form>
      <ul className="mt-4 divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2.5">
            {table === "brands" ? (
              <BrandImageButton brand={item as Brand} />
            ) : null}
            <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
            <button
              type="button"
              aria-label={`Delete ${item.name}`}
              onClick={() => remove.mutate(item.id)}
              className="text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="py-3 text-sm text-muted-foreground">Nothing yet.</li>
        )}
      </ul>
    </div>
  );
}

export function TaxonomyManager() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Manager table="brands" title="Brands" />
      <Manager table="categories" title="Categories" />
    </div>
  );
}
