import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  deliverySettingsQuery,
  setRuntimeDeliverySettings,
  setRuntimeStoreSettings,
  storeSettingsQuery,
  DELIVERY_DEFAULTS,
  STORE_DEFAULTS,
} from "@/lib/store-settings";

/** Store details managed from the admin dashboard. */
export function useStoreSettings() {
  const { data } = useQuery(storeSettingsQuery());
  useEffect(() => {
    if (data) setRuntimeStoreSettings(data);
  }, [data]);
  return data ?? STORE_DEFAULTS;
}

/** Delivery fees and regions managed from the admin dashboard. */
export function useDeliverySettings() {
  const { data } = useQuery(deliverySettingsQuery());
  useEffect(() => {
    if (data) setRuntimeDeliverySettings(data);
  }, [data]);
  return data ?? DELIVERY_DEFAULTS;
}

/** Keeps the runtime caches in sync for non-React helpers. */
export function StoreSettingsSync() {
  useStoreSettings();
  useDeliverySettings();
  return null;
}
