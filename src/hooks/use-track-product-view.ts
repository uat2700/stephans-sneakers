import { useEffect } from "react";
import { trackProductView } from "@/lib/product-views.functions";


const KEY = "sc-viewed-products";
const WINDOW_MS = 1000 * 60 * 60 * 6; // count one view per product per 6 hours

function readSeen(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

/**
 * Counts a product page visit so popular sneakers surface under
 * "Trending sneakers" on the homepage.
 */
export function useTrackProductView(productId: string | undefined) {
  useEffect(() => {
    if (!productId) return;
    const seen = readSeen();
    const now = Date.now();
    if (seen[productId] && now - seen[productId] < WINDOW_MS) return;

    seen[productId] = now;
    // prune stale entries
    for (const [id, at] of Object.entries(seen)) {
      if (now - at > WINDOW_MS * 8) delete seen[id];
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(seen));
    } catch {
      /* ignore quota errors */
    }

    void supabase.rpc("increment_product_views", { _product_id: productId });
  }, [productId]);
}
