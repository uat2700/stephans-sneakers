import { createFileRoute } from "@tanstack/react-router";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Stephans Collection" },
      {
        name: "description",
        content:
          "Stephans Collection curates premium sneakers at affordable prices for customers across Ghana.",
      },
      { property: "og:title", content: "About Stephans Collection" },
      {
        property: "og:description",
        content: "Premium sneakers, honest prices, fast delivery in Ghana.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="container-page max-w-3xl py-12 lg:py-16">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-5xl">
        About {SITE.name}
      </h1>
      <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
        <p>
          {SITE.name} started with one simple belief: great sneakers shouldn't cost a
          fortune. We source clean, well-made pairs, inspect every single one, and pass
          honest prices on to you.
        </p>
        <p>
          Ordering is deliberately simple. Browse the collection, add to cart or send us
          a message on WhatsApp, and we'll confirm your size and delivery within minutes.
          Accra orders usually arrive the same day, and the rest of Ghana within two to
          three working days.
        </p>
        <p>
          Every pair we ship is quality checked, and if the fit isn't right we'll sort out
          an exchange. That's the whole promise — good sneakers, fair prices, no drama.
        </p>
      </div>

      <dl className="mt-12 grid gap-6 sm:grid-cols-3">
        {[
          ["500+", "Happy customers"],
          ["16", "Regions served"],
          ["24hr", "Accra delivery"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-3xl bg-surface p-6">
            <dt className="font-display text-3xl font-extrabold">{value}</dt>
            <dd className="mt-1 text-sm text-muted-foreground">{label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
