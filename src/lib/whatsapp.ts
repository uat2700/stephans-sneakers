import { SITE } from "./site";
import { formatPrice } from "./format";

export function whatsappLink(message: string) {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function productMessage(opts: {
  name: string;
  price: number;
  size?: string | null;
}) {
  return [
    `Hello ${SITE.name},`,
    "",
    "I'm interested in this sneaker.",
    "",
    `Product: ${opts.name}`,
    `Price: ${formatPrice(opts.price)}`,
    `Size: ${opts.size || "-"}`,
    "",
    "Is it still available?",
  ].join("\n");
}

export function cartMessage(
  items: { name: string; price: number; size?: string | null; quantity: number }[],
  total: number,
) {
  return [
    `Hello ${SITE.name},`,
    "",
    "I'd like to order the following sneakers:",
    "",
    ...items.map(
      (i, idx) =>
        `${idx + 1}. ${i.name} — Size ${i.size || "-"} × ${i.quantity} — ${formatPrice(
          i.price * i.quantity,
        )}`,
    ),
    "",
    `Total: ${formatPrice(total)}`,
    "",
    "Please confirm availability and delivery.",
  ].join("\n");
}

export const generalWhatsappMessage = `Hello ${SITE.name}, I'd like to know more about your sneakers.`;
