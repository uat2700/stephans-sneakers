import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Home, Search, ShoppingBag, User } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/shop", label: "Shop", icon: Search },
  { to: "/wishlist", label: "Wishlist", icon: Heart },
  { to: "/cart", label: "Cart", icon: ShoppingBag },
  { to: "/account", label: "Account", icon: User },
] as const;

export function BottomNav() {
  const cart = useCart();
  const wishlist = useWishlist();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Product pages have their own sticky buy bar at the bottom on mobile.
  if (pathname.startsWith("/product/")) return null;

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          const badge =
            to === "/cart" ? cart.count : to === "/wishlist" ? wishlist.ids.length : 0;
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {badge > 0 ? (
                    <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[9px] font-bold text-background">
                      {badge}
                    </span>
                  ) : null}
                </span>
                {label}
                {active ? (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-foreground"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
