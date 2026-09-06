import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  inventorySettingsQuery,
  pricingSettingsQuery,
  saveSetting,
  type InventorySettings,
  type PricingSettings,
} from "@/lib/settings";
import {
  deliverySettingsQuery,
  storeSettingsQuery,
  type DeliverySettings,
  type StoreSettings,
} from "@/lib/store-settings";
import { REGIONS } from "@/lib/site";
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

export function SettingsPanel() {
  const queryClient = useQueryClient();
  const pricing = useQuery(pricingSettingsQuery());
  const inventory = useQuery(inventorySettingsQuery());
  const store = useQuery(storeSettingsQuery());
  const delivery = useQuery(deliverySettingsQuery());

  const [pricingDraft, setPricingDraft] = useState<PricingSettings | null>(null);
  const [inventoryDraft, setInventoryDraft] = useState<InventorySettings | null>(null);
  const [storeDraft, setStoreDraft] = useState<StoreSettings | null>(null);
  const [deliveryDraft, setDeliveryDraft] = useState<DeliverySettings | null>(null);
  const [newRegion, setNewRegion] = useState(REGIONS[0] ?? "");

  useEffect(() => {
    if (pricing.data && !pricingDraft) setPricingDraft(pricing.data);
  }, [pricing.data, pricingDraft]);
  useEffect(() => {
    if (inventory.data && !inventoryDraft) setInventoryDraft(inventory.data);
  }, [inventory.data, inventoryDraft]);
  useEffect(() => {
    if (store.data && !storeDraft) setStoreDraft(store.data);
  }, [store.data, storeDraft]);
  useEffect(() => {
    if (delivery.data && !deliveryDraft) setDeliveryDraft(delivery.data);
  }, [delivery.data, deliveryDraft]);

  const save = useMutation({
    mutationFn: async () => {
      if (pricingDraft) await saveSetting("pricing", pricingDraft);
      if (inventoryDraft) await saveSetting("inventory", inventoryDraft);
      if (storeDraft) await saveSetting("store", storeDraft);
      if (deliveryDraft) await saveSetting("delivery", deliveryDraft);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      toast.success("Settings saved");
    },
    onError: () => toast.error("Could not save settings"),
  });

  if (!pricingDraft || !inventoryDraft || !storeDraft || !deliveryDraft) {
    return <p className="text-sm text-muted-foreground">Loading settings…</p>;
  }

  const example =
    pricingDraft.markup_mode === "amount"
      ? 200 + pricingDraft.default_markup_amount
      : Math.round(200 * (1 + pricingDraft.default_markup_percent / 100));

  const setStore = (patch: Partial<StoreSettings>) =>
    setStoreDraft({ ...storeDraft, ...patch });

  return (
    <div className="max-w-2xl space-y-5">
      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-display text-sm font-extrabold uppercase tracking-tight">
          Store details
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Used across the storefront: WhatsApp button, footer, contact page.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs" htmlFor="store-name">
              Store name
            </Label>
            <Input
              id="store-name"
              value={storeDraft.name}
              onChange={(e) => setStore({ name: e.target.value })}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="store-whatsapp">
              WhatsApp number (with country code, no +)
            </Label>
            <Input
              id="store-whatsapp"
              inputMode="numeric"
              value={storeDraft.whatsapp_number}
              onChange={(e) =>
                setStore({ whatsapp_number: e.target.value.replace(/[^\d]/g, "") })
              }
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="store-phone">
              Phone
            </Label>
            <Input
              id="store-phone"
              value={storeDraft.phone}
              onChange={(e) => setStore({ phone: e.target.value })}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="store-email">
              Email
            </Label>
            <Input
              id="store-email"
              type="email"
              value={storeDraft.email}
              onChange={(e) => setStore({ email: e.target.value })}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="store-hours">
              Opening hours
            </Label>
            <Input
              id="store-hours"
              value={storeDraft.hours}
              onChange={(e) => setStore({ hours: e.target.value })}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="store-instagram">
              Instagram link
            </Label>
            <Input
              id="store-instagram"
              value={storeDraft.instagram}
              onChange={(e) => setStore({ instagram: e.target.value })}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="store-tiktok">
              TikTok link
            </Label>
            <Input
              id="store-tiktok"
              value={storeDraft.tiktok}
              onChange={(e) => setStore({ tiktok: e.target.value })}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="store-facebook">
              Facebook link
            </Label>
            <Input
              id="store-facebook"
              value={storeDraft.facebook}
              onChange={(e) => setStore({ facebook: e.target.value })}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs" htmlFor="store-template">
              WhatsApp message template
            </Label>
            <Input
              id="store-template"
              value={storeDraft.whatsapp_template}
              onChange={(e) => setStore({ whatsapp_template: e.target.value })}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-display text-sm font-extrabold uppercase tracking-tight">
          Delivery
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs" htmlFor="delivery-fee">
              Default delivery fee (GH₵)
            </Label>
            <Input
              id="delivery-fee"
              type="number"
              min={0}
              value={deliveryDraft.default_fee}
              onChange={(e) =>
                setDeliveryDraft({
                  ...deliveryDraft,
                  default_fee: Number(e.target.value) || 0,
                })
              }
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="delivery-free">
              Free delivery from (GH₵, 0 = never)
            </Label>
            <Input
              id="delivery-free"
              type="number"
              min={0}
              value={deliveryDraft.free_from}
              onChange={(e) =>
                setDeliveryDraft({
                  ...deliveryDraft,
                  free_from: Number(e.target.value) || 0,
                })
              }
              className="mt-1 h-10 rounded-xl"
            />
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Region fees
          </p>
          <ul className="mt-3 space-y-2">
            {deliveryDraft.regions.map((region, index) => (
              <li
                key={`${region.region}-${index}`}
                className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm">
                  {region.region}
                </span>
                <Input
                  type="number"
                  min={0}
                  value={region.fee}
                  onChange={(e) => {
                    const regions = [...deliveryDraft.regions];
                    regions[index] = {
                      ...region,
                      fee: Number(e.target.value) || 0,
                    };
                    setDeliveryDraft({ ...deliveryDraft, regions });
                  }}
                  className="h-9 w-24 rounded-xl"
                />
                <Switch
                  checked={region.is_active}
                  onCheckedChange={(checked) => {
                    const regions = [...deliveryDraft.regions];
                    regions[index] = { ...region, is_active: checked };
                    setDeliveryDraft({ ...deliveryDraft, regions });
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${region.region}`}
                  className="rounded-xl text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    setDeliveryDraft({
                      ...deliveryDraft,
                      regions: deliveryDraft.regions.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2">
            <Select value={newRegion} onValueChange={setNewRegion}>
              <SelectTrigger className="h-10 flex-1 rounded-xl">
                <SelectValue placeholder="Choose a region" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.filter(
                  (r) => !deliveryDraft.regions.some((x) => x.region === r),
                ).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                if (!newRegion) return;
                if (deliveryDraft.regions.some((r) => r.region === newRegion)) return;
                setDeliveryDraft({
                  ...deliveryDraft,
                  regions: [
                    ...deliveryDraft.regions,
                    {
                      region: newRegion,
                      fee: deliveryDraft.default_fee,
                      is_active: true,
                    },
                  ],
                });
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Add region
            </Button>
          </div>
        </div>
      </section>

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
