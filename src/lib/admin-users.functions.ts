import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ROLES = ["super_admin", "admin", "manager", "staff"] as const;

type AuthedContext = {
  supabase: {
    rpc: (
      fn: "admin_rank",
      args: { _user_id: string },
    ) => Promise<{ data: number | null; error: unknown }>;
  };
  userId: string;
};

async function requireRank(context: AuthedContext, min: number) {
  const { data } = await context.supabase.rpc("admin_rank", {
    _user_id: context.userId,
  });
  if ((data ?? 0) < min) throw new Error("Forbidden");
}

export type AdminUserRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  roles: string[];
  created_at: string | null;
};

export const listAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await requireRank(context as unknown as AuthedContext, 4);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: roleRows, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role, created_at");
    if (error) throw new Error("Could not load admins");

    const staffRows = (roleRows ?? []).filter((r) =>
      (ROLES as readonly string[]).includes(String(r.role)),
    );
    const ids = [...new Set(staffRows.map((r) => r.user_id))];
    if (ids.length === 0) return [];

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);

    return ids.map((id) => {
      const profile = profiles?.find((p) => p.id === id);
      const rows = staffRows.filter((r) => r.user_id === id);
      return {
        user_id: id,
        full_name: profile?.full_name ?? null,
        email: profile?.email ?? null,
        roles: rows.map((r) => String(r.role)),
        created_at: rows[0]?.created_at ?? null,
      };
    });
  });

export const grantAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email(),
        role: z.enum(ROLES),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireRank(context as unknown as AuthedContext, 4);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", data.email.toLowerCase().trim())
      .maybeSingle();
    if (!profile) {
      throw new Error("No customer account with that email — ask them to sign up first.");
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: profile.id, role: data.role })
      .select();
    if (error && !error.message.includes("duplicate")) {
      throw new Error("Could not grant that role");
    }
    return { ok: true, user_id: profile.id };
  });

export const revokeAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ user_id: z.string().uuid(), role: z.enum(ROLES) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireRank(context as unknown as AuthedContext, 4);
    if (data.user_id === context.userId && data.role === "super_admin") {
      throw new Error("You cannot remove your own Super Admin role");
    }
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", data.role);
    if (error) throw new Error("Could not revoke that role");
    return { ok: true };
  });
