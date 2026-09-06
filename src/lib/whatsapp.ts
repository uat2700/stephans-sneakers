import { SITE } from "./site";
import { formatPrice } from "./format";
import { currentStoreSettings } from "./store-settings";

function storeName() {
  return currentStoreSettings().name || SITE.name;
}

export function whatsappLink(message: string) {
  const number = currentStoreSettings().whatsapp_number || SITE.whatsappNumber;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function productMessage(opts: {
  name: string;
  price: number;
  size?: string | null;
}) {
  return [
    `Hello ${storeName()},`,
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
    `Hello ${storeName()},`,
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

/** Kept as a getter so the admin-managed template is always current. */
export function generalMessage() {
  const settings = currentStoreSettings();
  return (
    settings.whatsapp_template ||
    `Hello ${storeName()}, I'd like to know more about your sneakers.`
  );
}

export const generalWhatsappMessage = `Hello ${SITE.name}, I'd like to know more about your sneakers.`;
