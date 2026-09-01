import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PricingSettings = {
  markup_mode: "amount" | "percent";
  default_markup_amount: number;
  default_markup_percent: number;
};

export type InventorySettings = {
  low_stock_threshold: number;
};

export const PRICING_DEFAULTS: PricingSettings = {
  markup_mode: "amount",
  default_markup_amount: 100,
  default_markup_percent: 0,
};

export const INVENTORY_DEFAULTS: InventorySettings = {
  low_stock_threshold: 3,
};

export function settingsQuery<T extends object>(key: string, fallback: T) {
  return queryOptions({
    queryKey: ["store-settings", key],
    staleTime: 60_000,
    queryFn: async (): Promise<T> => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      const value = (data?.value ?? {}) as Partial<T>;
      return { ...fallback, ...value };
    },
  });
}

export const pricingSettingsQuery = () =>
  settingsQuery<PricingSettings>("pricing", PRICING_DEFAULTS);

export const inventorySettingsQuery = () =>
  settingsQuery<InventorySettings>("inventory", INVENTORY_DEFAULTS);

export async function saveSetting(key: string, value: object) {
  const { error } = await supabase
    .from("store_settings")
    .upsert({ key, value: value as never }, { onConflict: "key" });
  if (error) throw error;
}

export function sellingPriceFrom(
  supplierPrice: number,
  pricing: PricingSettings,
  overrideMarkupPercent?: number | null,
) {
  if (overrideMarkupPercent != null && overrideMarkupPercent > 0) {
    return Math.round(supplierPrice * (1 + overrideMarkupPercent / 100));
  }
  if (pricing.markup_mode === "percent") {
    return Math.round(supplierPrice * (1 + pricing.default_markup_percent / 100));
  }
  return Math.round(supplierPrice + pricing.default_markup_amount);
}
