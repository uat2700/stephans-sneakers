import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { SITE } from "@/lib/site";
import { generalWhatsappMessage, whatsappLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Stephans Collection" },
      {
        name: "description",
        content:
          "Reach Stephans Collection on WhatsApp, phone or email for sneaker orders, sizing help and delivery questions.",
      },
      { property: "og:title", content: "Contact Stephans Collection" },
      {
        property: "og:description",
        content: "WhatsApp, call or email us for orders and sizing help.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="container-page max-w-3xl py-12 lg:py-16">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-5xl">
        Contact us
      </h1>
      <p className="mt-3 text-muted-foreground">
        The fastest way to reach us is WhatsApp — we usually reply within minutes.
      </p>

      <a
        href={whatsappLink(generalWhatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-whatsapp px-8 font-semibold text-whatsapp-foreground"
      >
        <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
      </a>

      <ul className="mt-10 grid gap-4 sm:grid-cols-3">
        <li className="rounded-3xl border border-border p-6">
          <Phone className="h-5 w-5" aria-hidden="true" />
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Phone
          </p>
          <a href={`tel:+${SITE.whatsappNumber}`} className="text-sm font-semibold">
            +{SITE.whatsappNumber}
          </a>
        </li>
        <li className="rounded-3xl border border-border p-6">
          <Mail className="h-5 w-5" aria-hidden="true" />
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Email
          </p>
          <a href={`mailto:${SITE.email}`} className="break-all text-sm font-semibold">
            {SITE.email}
          </a>
        </li>
        <li className="rounded-3xl border border-border p-6">
          <MapPin className="h-5 w-5" aria-hidden="true" />
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Location
          </p>
          <p className="text-sm font-semibold">Accra, Ghana</p>
        </li>
      </ul>
    </div>
  );
}
