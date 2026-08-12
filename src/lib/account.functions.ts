import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Permanently deletes the signed-in customer's account.
 * Orders are kept for records but unlinked from the customer.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    await supabase.from("cart_items").delete().eq("user_id", userId);
    await supabase.from("wishlist").delete().eq("user_id", userId);
    await supabase.from("reviews").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("orders").update({ user_id: null }).eq("user_id", userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
