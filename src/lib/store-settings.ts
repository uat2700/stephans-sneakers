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

export * from "@/lib/store-config";
