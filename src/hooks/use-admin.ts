import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const RANKS = {
  super_admin: 4,
  admin: 3,
  manager: 2,
  staff: 1,
} as const;

export type AdminRole = keyof typeof RANKS;

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
};

export const ADMIN_ROLES = Object.keys(RANKS) as AdminRole[];

export function rankOf(roles: string[]) {
  return roles.reduce(
    (max, role) => Math.max(max, RANKS[role as AdminRole] ?? 0),
    0,
  );
}

/** Reads the signed-in user's own roles (RLS allows own rows only). */
export function useAdminAccess(user: User | null) {
  const query = useQuery({
    queryKey: ["admin-access", user?.id ?? null],
    enabled: Boolean(user),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      const roles = (data ?? []).map((row) => String(row.role));
      return { roles, rank: rankOf(roles) };
    },
  });

  return {
    roles: query.data?.roles ?? [],
    rank: user ? (query.data?.rank ?? null) : 0,
    loading: Boolean(user) && query.isLoading,
  };
}

export function roleLabelForRank(rank: number) {
  const entry = ADMIN_ROLES.find((role) => RANKS[role] === rank);
  return entry ? ROLE_LABELS[entry] : "Customer";
}
