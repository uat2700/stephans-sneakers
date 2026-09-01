import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Boxes,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { roleLabelForRank } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  minRank: number;
  group: string;
};

export const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, minRank: 1, group: "Overview" },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, minRank: 3, group: "Overview" },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag, minRank: 1, group: "Selling" },
  { to: "/admin/customers", label: "Customers", icon: Users, minRank: 2, group: "Selling" },
  { to: "/admin/products", label: "Products", icon: Package, minRank: 2, group: "Catalogue" },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes, minRank: 1, group: "Catalogue" },
  { to: "/admin/taxonomy", label: "Brands & categories", icon: Tags, minRank: 2, group: "Catalogue" },
  { to: "/admin/ai", label: "AI assistant", icon: Sparkles, minRank: 2, group: "Catalogue" },
  { to: "/admin/users", label: "Admin users", icon: ShieldCheck, minRank: 4, group: "Control" },
  { to: "/admin/activity", label: "Activity log", icon: Activity, minRank: 4, group: "Control" },
  { to: "/admin/settings", label: "Settings", icon: Settings, minRank: 3, group: "Control" },
];

const GROUPS = ["Overview", "Selling", "Catalogue", "Control"];

function NavLinks({
  rank,
  pathname,
  onNavigate,
}: {
  rank: number;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-6">
      {GROUPS.map((group) => {
        const items = ADMIN_NAV.filter(
          (item) => item.group === group && rank >= item.minRank,
        );
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {group}
            </p>
            <ul className="space-y-1">
              {items.map((item) => {
                const active =
                  item.to === "/admin"
                    ? pathname === "/admin" || pathname === "/admin/"
                    : pathname.startsWith(item.to);
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-surface hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  rank,
  email,
  children,
}: {
  rank: number;
  email: string | null;
  children: React.ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const current = ADMIN_NAV.find((item) =>
    item.to === "/admin"
      ? pathname === "/admin" || pathname === "/admin/"
      : pathname.startsWith(item.to),
  );

  const brand = (
    <div className="px-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
        Stephans Collection
      </p>
      <p className="font-display text-lg font-extrabold uppercase tracking-tight">
        Control panel
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface/40">
      <div className="mx-auto flex w-full max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card px-3 py-6 lg:flex">
          {brand}
          <div className="mt-8 flex-1 overflow-y-auto">
            <NavLinks rank={rank} pathname={pathname} />
          </div>
          <div className="mt-4 space-y-2 border-t border-border px-3 pt-4">
            <p className="truncate text-xs font-medium">{email ?? "Signed in"}</p>
            <p className="text-[11px] uppercase tracking-wide text-gold">
              {roleLabelForRank(rank)}
            </p>
            <div className="flex gap-2 pt-1">
              <Button asChild variant="ghost" size="sm" className="rounded-full px-3">
                <Link to="/">
                  <Store className="mr-1 h-3.5 w-3.5" /> Store
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-3"
                onClick={() => supabase.auth.signOut()}
              >
                Sign out
              </Button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl lg:hidden"
                    aria-label="Open admin menu"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[86vw] max-w-xs overflow-y-auto px-3 py-6">
                  <SheetTitle className="sr-only">Admin navigation</SheetTitle>
                  {brand}
                  <div className="mt-8">
                    <NavLinks
                      rank={rank}
                      pathname={pathname}
                      onNavigate={() => setOpen(false)}
                    />
                  </div>
                  <div className="mt-6 border-t border-border px-3 pt-4">
                    <p className="truncate text-xs">{email ?? "Signed in"}</p>
                    <p className="text-[11px] uppercase tracking-wide text-gold">
                      {roleLabelForRank(rank)}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button asChild variant="ghost" size="sm" className="rounded-full">
                        <Link to="/" onClick={() => setOpen(false)}>
                          View store
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => supabase.auth.signOut()}
                      >
                        Sign out
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="min-w-0 flex-1">
                <h1 className="truncate font-display text-lg font-extrabold uppercase tracking-tight sm:text-xl">
                  {current?.label ?? "Admin"}
                </h1>
              </div>
              <span className="hidden shrink-0 rounded-full border border-border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:inline">
                {roleLabelForRank(rank)}
              </span>
            </div>
          </header>

          <main className="px-4 py-5 pb-24 sm:px-6 sm:py-7">{children}</main>
        </div>
      </div>
    </div>
  );
}
