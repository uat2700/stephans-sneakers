import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { useAdminAccess } from "@/hooks/use-admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Control panel — Stephans Collection" },
      {
        name: "description",
        content:
          "Secure admin control panel for Stephans Collection: orders, products, inventory, customers and settings.",
      },
      { property: "og:title", content: "Control panel — Stephans Collection" },
      {
        property: "og:description",
        content: "Run the whole sneaker store from one dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading } = useSession();
  const { rank, loading: rankLoading } = useAdminAccess(user);

  if (loading || rankLoading || (user && rank === null)) {
    return (
      <div className="container-page flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-page max-w-md py-20 text-center">
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">
          Admin access
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in with your team account to open the control panel.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (!rank || rank < 1) {
    return (
      <div className="container-page max-w-md py-20 text-center">
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">
          Not authorised
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This account doesn't have admin access yet.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/">Back to store</Link>
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => supabase.auth.signOut()}
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminShell rank={rank} email={user.email ?? null}>
      <Outlet />
    </AdminShell>
  );
}
