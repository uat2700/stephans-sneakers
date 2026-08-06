import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, ShieldCheck, Star, Truck } from "lucide-react";
import heroImage from "@/assets/hero-sneaker.jpg";
import { BrandRail } from "@/components/brand-rail";
import { CategoryRail } from "@/components/category-rail";
import { FlashSale } from "@/components/flash-sale";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { InstagramGallery } from "@/components/instagram-gallery";
import { ProductCard } from "@/components/product-card";

import { QuickView } from "@/components/quick-view";
import { ProductGridSkeleton, EmptyState } from "@/components/product-grid-skeleton";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { Button } from "@/components/ui/button";
import {
  brandsQuery,
  categoriesQuery,
  productsQuery,
  type Product,
} from "@/lib/catalog";
import { SITE } from "@/lib/site";
import { generalWhatsappMessage, whatsappLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stephans Collection — Premium Sneakers in Ghana" },
      {
        name: "description",
        content:
          "Premium sneakers at affordable prices. Browse fresh drops, top brands and order instantly on WhatsApp with fast delivery across Ghana.",
      },
      { property: "og:title", content: "Stephans Collection — Premium Sneakers" },
      {
        property: "og:description",
        content:
          "Fresh drops from the biggest sneaker brands, delivered across Ghana.",
      },
    ],
  }),
  component: Home,
});

const TESTIMONIALS = [
  {
    name: "Kwame A.",
    location: "Accra",
    text: "Ordered on WhatsApp at noon and got my pair the same evening. Quality is unreal for the price.",
  },
  {
    name: "Ama B.",
    location: "Kumasi",
    text: "Exactly what was on the site. Clean packaging and the sizing was spot on.",
  },
  {
    name: "Selorm K.",
    location: "Tema",
    text: "My third order already. Stephans is my go-to for sneakers now.",
  },
];

function Home() {
  const [quick, setQuick] = useState<Product | null>(null);
  const products = useQuery(productsQuery());
  const brands = useQuery(brandsQuery());
  const categories = useQuery(categoriesQuery());

  const featured = (products.data ?? []).filter((p) => p.is_featured).slice(0, 8);
  const list = featured.length ? featured : (products.data ?? []).slice(0, 8);
  const all = products.data ?? [];
  const newest = all.filter((p) => p.is_new).slice(0, 4);
  const byPopularity = [...all].sort((a, b) => b.popularity - a.popularity);
  const visited = byPopularity.filter((p) => p.popularity > 0);
  const trending = visited.slice(0, 4);
  const bestSellers = (byPopularity.slice(4, 8).length
    ? byPopularity.slice(4, 8)
    : byPopularity.slice(0, 4)
  ).filter((p) => !trending.includes(p) || byPopularity.length <= 4);
  const deals = all
    .filter((p) => p.compare_at_price && p.compare_at_price > p.selling_price)
    .slice(0, 4);

  return (
    <>
      <section className="relative overflow-hidden bg-surface">
        <div className="container-page grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
              <span className="h-1.5 w-1.5 rounded-full bg-whatsapp" />
              Now delivering nationwide
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Step into
              <span className="block text-muted-foreground">your next pair</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              {SITE.tagline}. Curated drops, honest prices and instant ordering on
              WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link to="/shop">
                  Shop the collection
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <a
                href={whatsappLink(generalWhatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-whatsapp px-7 text-sm font-semibold text-whatsapp-foreground transition hover:opacity-90"
              >
                <WhatsAppIcon className="h-4 w-4" /> Order on WhatsApp
              </a>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                ["500+", "Pairs delivered"],
                ["24hr", "Accra delivery"],
                ["4.9★", "Customer rating"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-display text-2xl font-extrabold">{value}</dt>
                  <dd className="text-xs text-muted-foreground">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] bg-background shadow-xl">
              <img
                src={heroImage}
                alt="Premium white high-top sneaker"
                width={1920}
                height={1280}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Why shop with us" className="border-y border-border">
        <div className="container-page grid gap-6 py-8 sm:grid-cols-3">
          {[
            { icon: Truck, title: "Fast delivery", copy: "Nationwide, 1–3 days" },
            { icon: BadgeCheck, title: "Quality checked", copy: "Every pair inspected" },
            { icon: ShieldCheck, title: "Pay on delivery", copy: "Order with confidence" },
          ].map(({ icon: Icon, title, copy }) => (
            <div key={title} className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{title}</p>
                <p className="truncate text-xs text-muted-foreground">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
              Featured sneakers
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hand-picked pairs moving fastest this week.
            </p>
          </div>
          <Link
            to="/shop"
            className="shrink-0 text-sm font-semibold underline underline-offset-4"
          >
            View all
          </Link>
        </div>

        <div className="mt-8">
          {products.isLoading ? (
            <ProductGridSkeleton />
          ) : list.length ? (
            <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} onQuickView={setQuick} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No sneakers yet"
              description="Products added from the admin dashboard will appear here automatically."
              action={
                <Button asChild className="rounded-full">
                  <Link to="/admin">Go to admin</Link>
                </Button>
              }
            />
          )}
        </div>
      </section>

      {brands.data?.length ? (
        <section className="border-y border-border bg-surface">
          <div className="container-page py-12">
            <BrandRail brands={brands.data} />
          </div>
        </section>
      ) : null}

      <section className="container-page py-12">
        <CategoryRail categories={categories.data ?? []} />
      </section>

      {deals.length ? (
        <section className="border-y border-border bg-surface">
          <div className="container-page py-14">
            <FlashSale products={deals} onQuickView={setQuick} />
          </div>
        </section>
      ) : null}



      {newest.length ? (
        <section className="container-page py-14">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
            New arrivals
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {newest.map((p) => (
              <ProductCard key={p.id} product={p} onQuickView={setQuick} />
            ))}
          </div>
        </section>
      ) : null}

      {bestSellers.length ? (
        <section className="container-page py-14">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
            Best sellers
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Our most-ordered pairs, restocked regularly.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} onQuickView={setQuick} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="container-page py-14">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
          What customers say
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="rounded-3xl border border-border bg-card p-6"
            >
              <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" aria-hidden="true" />
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
                “{t.text}”
              </blockquote>
              <figcaption className="mt-4 text-sm font-semibold">
                {t.name}
                <span className="font-normal text-muted-foreground"> · {t.location}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="container-page py-6">
        <NewsletterSignup />
      </section>

      <section className="container-page py-14">
        <InstagramGallery products={all} />
      </section>

      <section className="container-page pb-16">
        <div className="rounded-[2rem] bg-foreground px-6 py-14 text-center text-background">
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight">
            Can't decide? Chat with us
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm opacity-80">
            Send us a photo or a model name and we'll find your size and price in
            minutes.
          </p>
          <a
            href={whatsappLink(generalWhatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-whatsapp px-8 font-semibold text-whatsapp-foreground"
          >
            <WhatsAppIcon className="h-5 w-5" /> Message {SITE.name}
          </a>
        </div>
      </section>

      <QuickView product={quick} onOpenChange={(o) => !o && setQuick(null)} />
    </>
  );
}
