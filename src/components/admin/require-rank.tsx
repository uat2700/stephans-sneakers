import { Loader2 } from "lucide-react";
import { useAdminAccess } from "@/hooks/use-admin";
import { useSession } from "@/hooks/use-auth";

/** Gates a single admin page on a minimum role rank. */
export function RequireRank({
  min,
  children,
}: {
  min: number;
  children: (ctx: { rank: number; userId: string }) => React.ReactNode;
}) {
  const { user, loading } = useSession();
  const { rank, loading: rankLoading } = useAdminAccess(user);

  if (loading || rankLoading || rank === null) {
    return (
      <div className="grid place-items-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!user || rank < min) {
    return (
      <div className="rounded-3xl border border-border bg-card p-10 text-center">
        <p className="font-display text-lg font-bold uppercase tracking-tight">
          Not available on your role
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask a Super Admin to upgrade your access to view this section.
        </p>
      </div>
    );
  }

  return <>{children({ rank, userId: user.id })}</>;
}
