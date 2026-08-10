import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const initSchema = z.object({
  order_number: z.string().trim().min(4).max(40),
  email: z.string().trim().email().max(255),
  callback_url: z.string().trim().url().max(500),
});

export const initPaystackPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => initSchema.parse(data))
  .handler(async ({ data, context }) => {
    const secret = process.env["PAYSTACK_SECRET_KEY"];
    if (!secret) throw new Error("Card payments are not configured yet");

    const { data: order, error } = await context.supabase
      .from("orders")
      .select("id, order_number, total")
      .eq("order_number", data.order_number)
      .maybeSingle();
    if (error || !order) throw new Error("Order not found");

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        amount: Math.round(Number(order.total) * 100),
        currency: "GHS",
        reference: `${order.order_number}-${Date.now()}`,
        callback_url: data.callback_url,
        metadata: { order_id: order.id, order_number: order.order_number },
      }),
    });

    const body = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string; reference?: string };
    };
    if (!res.ok || !body.status || !body.data?.authorization_url) {
      throw new Error(body.message || "Could not start the card payment");
    }

    return {
      authorization_url: body.data.authorization_url,
      reference: body.data.reference ?? "",
    };
  });

const verifySchema = z.object({
  reference: z.string().trim().min(4).max(120),
});

export const verifyPaystackPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => verifySchema.parse(data))
  .handler(async ({ data, context }) => {
    const secret = process.env["PAYSTACK_SECRET_KEY"];
    if (!secret) throw new Error("Card payments are not configured yet");

    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    const body = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: {
        status?: string;
        amount?: number;
        metadata?: { order_number?: string };
      };
    };
    if (!res.ok || !body.status || !body.data) {
      throw new Error(body.message || "Could not verify the payment");
    }

    const orderNumber = body.data.metadata?.order_number ?? null;
    const paid = body.data.status === "success";
    if (!orderNumber) return { paid, order_number: null };

    // Confirm the order belongs to the caller before touching payment status.
    const { data: order } = await context.supabase
      .from("orders")
      .select("id, order_number")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (!order) return { paid, order_number: orderNumber };

    if (paid) {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "paid", status: "confirmed" })
        .eq("id", order.id);
    }

    return { paid, order_number: order.order_number };
  });
