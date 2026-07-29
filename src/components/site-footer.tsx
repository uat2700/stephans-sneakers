import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { SITE } from "@/lib/site";
import { generalWhatsappMessage, whatsappLink } from "@/lib/whatsapp";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="font-display text-xl font-extrabold uppercase tracking-tight">
            Stephans
          </span>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Premium sneakers at affordable prices, delivered fast across Ghana.
          </p>
          <a
            href={whatsappLink(generalWhatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-whatsapp px-4 text-sm font-semibold text-whatsapp-foreground"
          >
            <WhatsAppIcon className="h-4 w-4" /> Chat with us
          </a>
        </div>

        <nav aria-label="Shop links">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em]">
            Shop
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <Link to="/shop" className="hover:text-foreground">
                All sneakers
              </Link>
            </li>
            <li>
              <Link to="/new-arrivals" className="hover:text-foreground">
                New arrivals
              </Link>
            </li>
            <li>
              <Link to="/brands" className="hover:text-foreground">
                Brands
              </Link>
            </li>
            <li>
              <Link to="/wishlist" className="hover:text-foreground">
                Wishlist
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Company links">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em]">
            Company
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="hover:text-foreground">
                About us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/account" className="hover:text-foreground">
                My account
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-foreground">
                Cart
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em]">
            Get in touch
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <a href={`tel:+${SITE.whatsappNumber}`}>+{SITE.whatsappNumber}</a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Accra, Ghana
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <p>Fast delivery nationwide · Secure ordering</p>
        </div>
      </div>
    </footer>
  );
}
