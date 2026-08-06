import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({ productId: z.string().uuid() });

/**
 * Counts a product page view. Runs server-side with privileged access so the
 * popularity counter is not writable/callable directly from the browser.
 */
export const trackProductView = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    await supabaseAdmin.rpc("increment_product_views", {
      _product_id: data.productId,
    });
    return { ok: true };
  });
