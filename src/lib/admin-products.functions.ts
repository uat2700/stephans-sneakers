import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden");

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("products")
      .select(ADMIN_PRODUCT_SELECT)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load products");
    return (data ?? []) as Record<string, unknown>[];
  });
