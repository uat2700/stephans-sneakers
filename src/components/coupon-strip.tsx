import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { activeCouponsQuery } from "@/lib/store-settings";
import { formatPrice } from "@/lib/format";

/**
 * Oraimo-style coupon banner. Shows the store's active coupons
 * (managed in Admin → Coupons). Hidden when there are none.
 */
export function CouponStrip() {
  const coupons = useQuery(activeCouponsQuery());
  const list = (coupons.data ?? []).slice(0, 3);
  if (!list.length) return null;

  return (
    <section aria-label="Coupons" className="container-page py-4">
      <div className="flex items-stretch gap-2 overflow-x-auto rounded-2xl bg-whatsapp p-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {list.map((c) => (
          <div
            key={c.id}
            className="flex shrink-0 flex-col items-center justify-center rounded-xl bg-background px-5 py-3 text-center"
          >
            <p className="font-display text-lg font-extrabold leading-none">
              {c.discount_type === "percent" ? `${c.value}%` : formatPrice(c.value)} OFF
            </p>
            <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground">
              {c.min_order > 0 ? `over ${formatPrice(c.min_order)}` : "no minimum"} · code {c.code}
            </p>
          </div>
        ))}
        <Link
          to="/shop"
          className="ml-auto flex shrink-0 items-center rounded-xl bg-foreground px-5 text-sm font-bold text-background"
        >
          Grab now
        </Link>
      </div>
    </section>
  );
}
