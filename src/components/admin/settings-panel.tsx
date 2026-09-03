import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  inventorySettingsQuery,
  pricingSettingsQuery,
  saveSetting,
  type InventorySettings,
  type PricingSettings,
} from "@/lib/settings";
import { formatPrice } from "@/lib/format";
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

export function SettingsPanel() {
  const queryClient = useQueryClient();
  const pricing = useQuery(pricingSettingsQuery());
  const inventory = useQuery(inventorySettingsQuery());

  const [pricingDraft, setPricingDraft] = useState<PricingSettings | null>(null);
  const [inventoryDraft, setInventoryDraft] = useState<InventorySettings | null>(null);

  useEffect(() => {
    if (pricing.data && !pricingDraft) setPricingDraft(pricing.data);
  }, [pricing.data, pricingDraft]);
  useEffect(() => {
    if (inventory.data && !inventoryDraft) setInventoryDraft(inventory.data);
  }, [inventory.data, inventoryDraft]);

  const save = useMutation({
    mutationFn: async () => {
      if (pricingDraft) await saveSetting("pricing", pricingDraft);
      if (inventoryDraft) await saveSetting("inventory", inventoryDraft);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      toast.success("Settings saved");
    },
    onError: () => toast.error("Could not save settings"),
  });

  if (!pricingDraft || !inventoryDraft) {
    return <p className="text-sm text-muted-foreground">Loading settings…</p>;
  }

  const example =
    pricingDraft.markup_mode === "amount"
      ? 200 + pricingDraft.default_markup_amount
      : Math.round(200 * (1 + pricingDraft.default_markup_percent / 100));

  return (
    <div className="max-w-2xl space-y-5">
      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-display text-sm font-extrabold uppercase tracking-tight">
          Default markup
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Used when adding products: supplier price + markup = selling price.
          Individual products can override this.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Markup type</Label>
            <Select
              value={pricingDraft.markup_mode}
              onValueChange={(value) =>
                setPricingDraft({
                  ...pricingDraft,
                  markup_mode: value as PricingSettings["markup_mode"],
                })
              }
            >
              <SelectTrigger className="mt-1 h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amount">Fixed amount (GH₵)</SelectItem>
                <SelectItem value="percent">Percentage (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {pricingDraft.markup_mode === "amount" ? (
            <div>
              <Label className="text-xs" htmlFor="markup-amount">
                Markup amount
              </Label>
              <Input
                id="markup-amount"
                type="number"
                min={0}
                value={pricingDraft.default_markup_amount}
                onChange={(e) =>
                  setPricingDraft({
                    ...pricingDraft,
                    default_markup_amount: Number(e.target.value) || 0,
                  })
                }
                className="mt-1 h-10 rounded-xl"
              />
            </div>
          ) : (
            <div>
              <Label className="text-xs" htmlFor="markup-percent">
                Markup percent
              </Label>
              <Input
                id="markup-percent"
                type="number"
                min={0}
                value={pricingDraft.default_markup_percent}
                onChange={(e) =>
                  setPricingDraft({
                    ...pricingDraft,
                    default_markup_percent: Number(e.target.value) || 0,
                  })
                }
                className="mt-1 h-10 rounded-xl"
              />
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Example: supplier {formatPrice(200)} → selling {formatPrice(example)}
        </p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-display text-sm font-extrabold uppercase tracking-tight">
          Inventory alerts
        </h2>
        <div className="mt-4 max-w-xs">
          <Label className="text-xs" htmlFor="low-stock">
            Low stock threshold (pairs)
          </Label>
          <Input
            id="low-stock"
            type="number"
            min={0}
            value={inventoryDraft.low_stock_threshold}
            onChange={(e) =>
              setInventoryDraft({
                low_stock_threshold: Number(e.target.value) || 0,
              })
            }
            className="mt-1 h-10 rounded-xl"
          />
        </div>
      </section>

      <Button
        className="rounded-full"
        disabled={save.isPending}
        onClick={() => save.mutate()}
      >
        {save.isPending ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
