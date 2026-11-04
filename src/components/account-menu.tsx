import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, LayoutDashboard, LogOut, Package, User, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsAdmin, useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function AccountMenu({ className = "" }: { className?: string }) {
  const { user, loading } = useSession();
  const isAdmin = useIsAdmin(user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const profile = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  if (loading || !user) {
    return (
      <Link
        to="/auth"
        aria-label="Sign in"
        className={`h-10 w-10 place-items-center rounded-full hover:bg-surface ${className}`}
      >
        <User className="h-[18px] w-[18px]" aria-hidden="true" />
      </Link>
    );
  }

  const name = profile.data?.full_name || user.email || "Account";
  const avatar = profile.data?.avatar_url ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className={`h-10 w-10 place-items-center rounded-full hover:bg-surface ${className}`}
      >
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="h-8 w-8 rounded-full border border-border object-cover"
          />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full border border-border bg-muted text-xs font-bold">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account" className="flex items-center gap-2">
            <UserRound className="h-4 w-4" /> My account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account" className="flex items-center gap-2">
            <Package className="h-4 w-4" /> Orders
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/wishlist" className="flex items-center gap-2">
            <Heart className="h-4 w-4" /> Wishlist
          </Link>
        </DropdownMenuItem>
        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
