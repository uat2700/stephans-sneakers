import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  value: number;
  min_order: number;
  max_discount: number | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
};

const emptyDraft = {
  code: "",
  discount_type: "percent" as "percent" | "amount",
  value: "10",
  min_order: "0",
  max_discount: "",
  starts_at: "",
  ends_at: "",
  usage_limit: "",
};

export function PromotionsPanel({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(emptyDraft);

  const coupons = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: async (): Promise<Coupon[]> => {
      const { data, error } = await supabase
        .from("coupons")
        .select(
          "id, code, discount_type, value, min_order, max_discount, starts_at, ends_at, usage_limit, used_count, is_active",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c) => ({
        ...c,
        value: Number(c.value),
        min_order: Number(c.min_order),
        max_discount: c.max_discount === null ? null : Number(c.max_discount),
      }));
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    queryClient.invalidateQueries({ queryKey: ["coupons"] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const code = draft.code.trim().toUpperCase();
      if (code.length < 3) throw new Error("Give the coupon a code");
      const value = Number(draft.value);
      if (!value || value <= 0) throw new Error("Set a discount value");
      const { error } = await supabase.from("coupons").insert({
        code,
        discount_type: draft.discount_type,
        value,
        min_order: Number(draft.min_order) || 0,
        max_discount: draft.max_discount ? Number(draft.max_discount) : null,
        starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
        ends_at: draft.ends_at ? new Date(draft.ends_at).toISOString() : null,
        usage_limit: draft.usage_limit ? Number(draft.usage_limit) : null,
        is_active: true,
      });
      if (error) throw error;
      await logActivity({
        actorId: userId,
        action: "coupon.create",
        entity: "coupons",
        details: { code },
      });
    },
    onSuccess: () => {
      setDraft(emptyDraft);
      refresh();
      toast.success("Coupon created");
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not create coupon"),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: () => toast.error("Could not update coupon"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
      await logActivity({
        actorId: userId,
        action: "coupon.delete",
        entity: "coupons",
        entityId: id,
      });
    },
    onSuccess: () => {
      refresh();
      toast.success("Coupon deleted");
    },
    onError: () => toast.error("Could not delete coupon"),
  });

  return (
    <div className="max-w-3xl space-y-5">
      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-display text-sm font-extrabold uppercase tracking-tight">
          New coupon
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Customers type the code at checkout and the discount applies automatically.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs" htmlFor="coupon-code">
              Code
            </Label>
            <Input
              id="coupon-code"
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value })}
              placeholder="SNEAK10"
              className="mt-1 h-10 rounded-xl uppercase"
            />
          </div>
          <div>
            <Label className="text-xs">Discount type</Label>
            <Select
              value={draft.discount_type}
              onValueChange={(v) =>
                setDraft({ ...draft, discount_type: v as "percent" | "amount" })
              }
            >
              <SelectTrigger className="mt-1 h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percentage (%)</SelectItem>
                <SelectItem value="amount">Fixed amount (GH₵)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs" htmlFor="coupon-value">
              Value
            </Label>
            <Input
              id="coupon-value"
              type="number"
              min={0}
              value={draft.value}
              onChange={(e) => setDraft({ ...draft, value: e.target.value })}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="coupon-min">
              Minimum order (GH₵)
            </Label>
            <Input
              id="coupon-min"
              type="number"
              min={0}
              value={draft.min_order}
              onChange={(e) => setDraft({ ...draft, min_order: e.target.value })}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="coupon-max">
              Maximum discount (GH₵)
            </Label>
            <Input
              id="coupon-max"
              type="number"
              min={0}
              value={draft.max_discount}
              onChange={(e) => setDraft({ ...draft, max_discount: e.target.value })}
              placeholder="Optional"
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="coupon-limit">
              Usage limit
            </Label>
            <Input
              id="coupon-limit"
              type="number"
              min={1}
              value={draft.usage_limit}
              onChange={(e) => setDraft({ ...draft, usage_limit: e.target.value })}
              placeholder="Unlimited"
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="coupon-start">
              Starts
            </Label>
            <Input
              id="coupon-start"
              type="date"
              value={draft.starts_at}
              onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="coupon-end">
              Ends
            </Label>
            <Input
              id="coupon-end"
              type="date"
              value={draft.ends_at}
              onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
        </div>
        <Button
          className="mt-4 rounded-full"
          disabled={create.isPending}
          onClick={() => create.mutate()}
        >
          <Plus className="mr-1 h-4 w-4" />
          {create.isPending ? "Creating…" : "Create coupon"}
        </Button>
      </section>

      {coupons.isLoading ? (
        <div className="grid place-items-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (coupons.data?.length ?? 0) === 0 ? (
        <p className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No coupons yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {coupons.data!.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-4"
            >
              <div className="min-w-[180px]">
                <p className="font-display text-base font-extrabold uppercase tracking-tight">
                  {c.code}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.discount_type === "percent"
                    ? `${c.value}% off`
                    : `${formatPrice(c.value)} off`}
                  {c.min_order > 0 ? ` · min ${formatPrice(c.min_order)}` : ""}
                  {c.max_discount ? ` · max ${formatPrice(c.max_discount)}` : ""}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Used {c.used_count}
                  {c.usage_limit ? ` of ${c.usage_limit}` : ""}
                  {c.ends_at
                    ? ` · ends ${new Date(c.ends_at).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Active
                  </Label>
                  <Switch
                    checked={c.is_active}
                    onCheckedChange={(checked) =>
                      toggle.mutate({ id: c.id, active: checked })
                    }
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${c.code}`}
                  className="rounded-xl text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (window.confirm(`Delete coupon ${c.code}?`)) remove.mutate(c.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
