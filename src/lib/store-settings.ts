import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery } from "@/lib/settings";
import {
  DELIVERY_DEFAULTS,
  HOMEPAGE_DEFAULTS,
  STORE_DEFAULTS,
  type DeliverySettings,
  type HomepageSettings,
  type StoreSettings,
} from "@/lib/store-config";

export const storeSettingsQuery = () =>
  settingsQuery<StoreSettings>("store", STORE_DEFAULTS);
export const deliverySettingsQuery = () =>
  settingsQuery<DeliverySettings>("delivery", DELIVERY_DEFAULTS);
export const homepageSettingsQuery = () =>
  settingsQuery<HomepageSettings>("homepage", HOMEPAGE_DEFAULTS);

/** Public banners for the storefront home page. */
export type PublicBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
};

export const activeBannersQuery = () =>
  queryOptions({
    queryKey: ["banners"],
    staleTime: 30_000,
    queryFn: async (): Promise<PublicBanner[]> => {
      const { data, error } = await supabase
        .from("banners")
        .select("id,title,subtitle,image_url,link_url")
        .eq("is_active", true)
        .order("position", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

/** Active coupons for the storefront coupon strip. */
export type PublicCoupon = {
  id: string;
  code: string;
  discount_type: string;
  value: number;
  min_order: number;
};

export const activeCouponsQuery = () =>
  queryOptions({
    queryKey: ["coupons", "active"],
    staleTime: 60_000,
    queryFn: async (): Promise<PublicCoupon[]> => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("coupons")
        .select("id,code,discount_type,value,min_order")
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("value", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []).map((c) => ({
        ...c,
        value: Number(c.value),
        min_order: Number(c.min_order),
      }));
    },
  });

export * from "@/lib/store-config";
