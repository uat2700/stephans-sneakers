import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { brandsQuery, categoriesQuery } from "@/lib/catalog";
import { slugify } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
          <li key={item.id} className="flex items-center justify-between py-2.5">
            <span className="text-sm">{item.name}</span>
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
        {query.data?.length === 0 && (
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
