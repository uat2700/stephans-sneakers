import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Product } from "@/lib/catalog";

const ADMIN_PRODUCT_SELECT = `
  id, name, slug, description, brand_id, category_id, supplier_price, selling_price,
  compare_at_price, markup_percent, sizes, colors, gender, stock, is_featured, is_new, is_active,
  popularity, tags, seo_title, seo_description, ai_caption, created_at,
  brands ( id, name, slug, logo_url, is_featured ),
  categories ( id, name, slug, image_url ),
  product_images ( id, url, alt, position )
`;

export const listAdminProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: rank } = await supabase.rpc("admin_rank", {
      _user_id: userId,
    });
    if (Number(rank ?? 0) < 1) throw new Error("Forbidden");


    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("products")
      .select(ADMIN_PRODUCT_SELECT)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load products");
    return (data ?? []) as unknown as Product[];
  });
