import { Link } from "@tanstack/react-router";
import {
  Baby,
  Footprints,
  Mountain,
  PersonStanding,
  Sparkles,
  Timer,
  Users,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/catalog";

const ICONS: Record<string, LucideIcon> = {
  running: Timer,
  casual: Footprints,
  basketball: Zap,
  lifestyle: Sparkles,
  slides: Waves,
  "high-tops": Mountain,
  "low-tops": Footprints,
  men: PersonStanding,
  mens: PersonStanding,
  women: Users,
  womens: Users,
  kids: Baby,
};

const FALLBACK = [
  "Running",
  "Casual",
  "Basketball",
  "Lifestyle",
  "Slides",
  "High Tops",
  "Low Tops",
  "Men's",
  "Women's",
  "Kids",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CategoryRail({
  categories,
  showHeading = true,
}: {
  categories: Category[];
  showHeading?: boolean;
}) {
  const items = categories.length
    ? categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, image: c.image_url }))
    : FALLBACK.map((name) => ({
        id: name,
        name,
        slug: slugify(name),
        image: null as string | null,
      }));

  return (
    <div>
      {showHeading ? (
        <>
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
            Shop by category
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a style and we'll show you the pairs.
          </p>
        </>
      ) : null}

      <ul className={`grid grid-cols-5 gap-x-1.5 gap-y-6 ${showHeading ? "mt-6" : ""}`}>
        {items.map((item) => {
          const Icon = ICONS[item.slug] ?? Footprints;
          return (
            <li key={item.id}>
              <Link
                to="/shop"
                search={{ category: item.slug }}
                className="group flex flex-col items-center gap-2 text-center"
              >
                <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-full border border-border bg-surface transition group-hover:border-foreground sm:h-20 sm:w-20">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  )}
                </span>
                <span className="line-clamp-2 w-full max-w-full break-words text-[9px] font-semibold uppercase tracking-normal sm:text-[11px] sm:tracking-wide">
                  {item.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
