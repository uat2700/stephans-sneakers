import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Heart, Moon, ShoppingBag, Sun, User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SearchPanel } from "@/components/search-panel";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useTheme } from "@/hooks/use-theme";
import { SITE } from "@/lib/site";
import { generalWhatsappMessage, whatsappLink } from "@/lib/whatsapp";

const NAV = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Brands", to: "/brands" },
  { label: "New Arrivals", to: "/new-arrivals" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
] as const;

function Hamburger({ open, onClick }: { open: boolean; onClick: () => void }) {
  const bars = [
    { y: -6, rotate: open ? 45 : 0, top: open },
    { y: 0, rotate: 0, top: false },
    { y: 6, rotate: open ? -45 : 0, top: open },
  ];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-surface lg:hidden"
    >
      <span className="relative block h-4 w-5">
        {bars.map((bar, i) => (
          <motion.span
            key={i}
            className="absolute left-0 top-1/2 block h-[2px] w-5 rounded-full bg-foreground"
            animate={{
              y: open && i !== 1 ? 0 : bar.y,
              rotate: bar.rotate,
              opacity: open && i === 1 ? 0 : 1,
            }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          />
        ))}
      </span>
    </button>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const cart = useCart();
  const wishlist = useWishlist();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-lg">
      <div className="container-page flex h-16 items-center gap-2 sm:gap-3">
        <Hamburger open={menuOpen} onClick={() => setMenuOpen((v) => !v)} />

        <Link to="/" className="min-w-0 shrink-0">
          <span className="font-display text-base font-extrabold uppercase leading-none tracking-tight sm:text-lg">
            Stephans
            <span className="block text-[10px] font-semibold tracking-[0.35em] text-muted-foreground">
              COLLECTION
            </span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-5 xl:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="text-sm font-medium transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <SearchPanel className="ml-4 hidden flex-1 lg:block" />

        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface"
          >
            {theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
            ) : (
              <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
            )}
          </button>
          <Link
            to="/account"
            aria-label="Notifications"
            className="relative hidden h-10 w-10 place-items-center rounded-full hover:bg-surface sm:grid"
          >
            <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-whatsapp" />
          </Link>
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-surface"
          >
            <Heart className="h-[18px] w-[18px]" aria-hidden="true" />
            {wishlist.ids.length > 0 ? (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                {wishlist.ids.length}
              </span>
            ) : null}
          </Link>
          <Link
            to="/cart"
            aria-label="Cart"
            className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-surface"
          >
            <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
            {cart.count > 0 ? (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                {cart.count}
              </span>
            ) : null}
          </Link>
          <Link
            to="/account"
            aria-label="My account"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface"
          >
            <User className="h-[18px] w-[18px]" aria-hidden="true" />
          </Link>
          <a
            href={whatsappLink(generalWhatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 hidden h-10 items-center gap-2 rounded-full bg-whatsapp px-4 text-sm font-semibold text-whatsapp-foreground transition hover:opacity-90 xl:inline-flex"
          >
            <WhatsAppIcon className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </div>

      <div className="border-t border-border bg-background lg:hidden">
        <div className="container-page py-2.5">
          <SearchPanel />
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex items-center justify-between border-b border-border p-4">
            <span className="font-display text-lg font-extrabold uppercase">
              {SITE.name}
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <AnimatePresence>
            <nav className="flex flex-col p-2" aria-label="Mobile">
              {[...NAV, { label: "My Account", to: "/account" } as const].map(
                (item, i) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * i, duration: 0.2 }}
                  >
                    <Link
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-4 py-3 text-base font-medium hover:bg-surface"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ),
              )}
            </nav>
          </AnimatePresence>
          <div className="space-y-2 p-4">
            <button
              type="button"
              onClick={toggle}
              className="flex h-11 w-full items-center justify-between rounded-xl border border-border px-4 text-sm font-medium hover:bg-surface"
            >
              <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
              {theme === "dark" ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <a
              href={whatsappLink(generalWhatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-whatsapp font-semibold text-whatsapp-foreground"
            >
              <WhatsAppIcon className="h-4 w-4" /> Chat on WhatsApp
            </a>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
