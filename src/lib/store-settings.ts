import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery } from "@/lib/settings";

export type StoreSettings = {
  name: string;
  whatsapp_number: string;
  phone: string;
  email: string;
  currency: string;
  hours: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  whatsapp_template: string;
};

export type DeliveryRegion = {
  region: string;
  fee: number;
  is_active: boolean;
};

export type DeliverySettings = {
  default_fee: number;
  free_from: number;
  regions: DeliveryRegion[];
};

export type HomepageSettings = {
  hero_title: string;
  hero_subtitle: string;
  hero_note: string;
  show_banners: boolean;
  show_categories: boolean;
  show_brands: boolean;
  show_flash_sale: boolean;
  show_featured: boolean;
  show_new: boolean;
  show_best_sellers: boolean;
  show_trending: boolean;
  show_testimonials: boolean;
  show_instagram: boolean;
  show_newsletter: boolean;
};

export const STORE_DEFAULTS: StoreSettings = {
  name: "Stephans Collection",
  whatsapp_number: "233508928908",
  phone: "+233508928908",
  email: "hello@stephanscollection.com",
  currency: "GHS",
  hours: "Mon - Sat, 9am - 7pm",
  instagram: "",
  tiktok: "",
  facebook: "",
  whatsapp_template:
    "Hello Stephans Collection, I would like to know more about your sneakers.",
};

export const DELIVERY_DEFAULTS: DeliverySettings = {
  default_fee: 30,
  free_from: 1000,
  regions: [],
};

export const HOMEPAGE_DEFAULTS: HomepageSettings = {
  hero_title: "Step into",
  hero_subtitle: "your next pair",
  hero_note: "",
  show_banners: true,
  show_categories: true,
  show_brands: true,
  show_flash_sale: true,
  show_featured: true,
  show_new: true,
  show_best_sellers: true,
  show_trending: true,
  show_testimonials: true,
  show_instagram: true,
  show_newsletter: true,
};

export const storeSettingsQuery = () =>
  settingsQuery<StoreSettings>("store", STORE_DEFAULTS);
export const deliverySettingsQuery = () =>
  settingsQuery<DeliverySettings>("delivery", DELIVERY_DEFAULTS);
export const homepageSettingsQuery = () =>
  settingsQuery<HomepageSettings>("homepage", HOMEPAGE_DEFAULTS);

/**
 * Runtime cache so non-React helpers (WhatsApp links, order totals in the
 * browser) can read the admin-managed store settings.
 */
let runtimeStore: StoreSettings = STORE_DEFAULTS;
let runtimeDelivery: DeliverySettings = DELIVERY_DEFAULTS;

export function currentStoreSettings() {
  return runtimeStore;
}
export function currentDeliverySettings() {
  return runtimeDelivery;
}
export function setRuntimeStoreSettings(value: StoreSettings) {
  runtimeStore = value;
}
export function setRuntimeDeliverySettings(value: DeliverySettings) {
  runtimeDelivery = value;
}

export function deliveryFeeFor(
  subtotal: number,
  region: string | null,
  settings: DeliverySettings = runtimeDelivery,
) {
  if (subtotal <= 0) return 0;
  if (settings.free_from > 0 && subtotal >= settings.free_from) return 0;
  const match = region
    ? settings.regions.find(
        (r) => r.region.toLowerCase() === region.toLowerCase() && r.is_active,
      )
    : null;
  return match ? Number(match.fee) : Number(settings.default_fee);
}

export function activeDeliveryRegions(settings: DeliverySettings) {
  return settings.regions.filter((r) => r.is_active);
}

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
