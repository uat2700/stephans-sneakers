import { SITE } from "./site";

export function formatPrice(value: number | string | null | undefined) {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return `${SITE.currency} ${n.toLocaleString("en-GH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function discountPercent(
  selling: number,
  compareAt?: number | null,
): number | null {
  if (!compareAt || compareAt <= selling) return null;
  return Math.round(((compareAt - selling) / compareAt) * 100);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
