import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, Moon, Search, ShoppingBag, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
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

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const cart = useCart();
  const wishlist = useWishlist();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchOpen(false);
    setMenuOpen(false);
    navigate({ to: "/shop", search: { q: term.trim() || undefined } });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-lg">
      <div className="container-page flex h-16 items-center gap-3">
        <button
          type="button"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-surface lg:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <Link to="/" className="min-w-0 shrink-0">
          <span className="font-display text-base font-extrabold uppercase leading-none tracking-tight sm:text-lg">
            Stephans
            <span className="block text-[10px] font-semibold tracking-[0.35em] text-muted-foreground">
              COLLECTION
            </span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 lg:flex" aria-label="Main">
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

        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search products"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface"
          >
            <Search className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="hidden h-10 w-10 place-items-center rounded-full hover:bg-surface sm:grid"
          >
            {theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
            ) : (
              <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
            )}
          </button>
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
          <a
            href={whatsappLink(generalWhatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 hidden h-10 items-center gap-2 rounded-full bg-whatsapp px-4 text-sm font-semibold text-whatsapp-foreground transition hover:opacity-90 md:inline-flex"
          >
            <WhatsAppIcon className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </div>

      {searchOpen ? (
        <div className="border-t border-border bg-background">
          <form onSubmit={submitSearch} className="container-page flex gap-2 py-3">
            <Input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search sneakers, brands…"
              aria-label="Search sneakers"
              className="h-11 rounded-full"
            />
            <Button type="submit" className="h-11 rounded-full px-5">
              Search
            </Button>
          </form>
        </div>
      ) : null}

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
          <nav className="flex flex-col p-2" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium hover:bg-surface"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/account"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-medium hover:bg-surface"
            >
              My Account
            </Link>
          </nav>
          <div className="p-4">
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
