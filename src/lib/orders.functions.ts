import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DELIVERY_DEFAULTS, deliveryFeeFor } from "@/lib/store-config";

const orderSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(255).nullable(),
  address: z.string().trim().min(4).max(300),
  city: z.string().trim().min(2).max(120),
  region: z.string().trim().min(2).max(120),
  notes: z.string().trim().max(1000).nullable(),
  payment_method: z.enum(["whatsapp", "paystack"]).default("whatsapp"),

  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        size: z.string().trim().max(20).nullable(),
        color: z.string().trim().max(40).nullable(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(50),
});

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => orderSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Authoritative prices come from the database, never from the browser.
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, selling_price, is_active")
      .in(
        "id",
        data.items.map((i) => i.product_id),
      );
    if (productsError) throw new Error("Could not verify product prices");

    const byId = new Map((products ?? []).map((p) => [p.id, p]));

    const items = data.items.map((item) => {
      const product = byId.get(item.product_id);
      if (!product || !product.is_active) {
        throw new Error("One of the items is no longer available");
      }
      return {
        product_id: product.id,
        product_name: product.name,
        size: item.size,
        color: item.color,
        unit_price: Number(product.selling_price),
        quantity: item.quantity,
      };
    });

    const subtotal = items.reduce(
      (sum, i) => sum + i.unit_price * i.quantity,
      0,
    );
    // Delivery fee comes from the admin-managed settings, never the browser.
    const { data: deliveryRow } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "delivery")
      .maybeSingle();
    const deliverySettings = {
      ...DELIVERY_DEFAULTS,
      ...((deliveryRow?.value ?? {}) as Partial<typeof DELIVERY_DEFAULTS>),
    };
    const delivery_fee = deliveryFeeFor(subtotal, data.region, deliverySettings);
    const total = subtotal + delivery_fee;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        full_name: data.full_name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        region: data.region,
        notes: data.notes,
        payment_method: data.payment_method,
        subtotal,

        delivery_fee,
        total,
      })
      .select("id, order_number")
      .single();
    if (error || !order) throw new Error("Could not create your order");

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(items.map((i) => ({ ...i, order_id: order.id })));
    if (itemsError) throw new Error("Could not save your order items");

    return {
      order_number: order.order_number,
      items: items.map((i) => ({
        name: i.product_name,
        price: i.unit_price,
        size: i.size,
        quantity: i.quantity,
      })),
      subtotal,
      delivery_fee,
      total,
    };
  });
