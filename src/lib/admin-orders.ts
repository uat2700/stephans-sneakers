import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;

export type AdminOrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  size: string | null;
  color: string | null;
  products: { brand_id: string | null; category_id: string | null } | null;
};

export type AdminOrder = {
  id: string;
  order_number: string;
  user_id: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  region: string;
  notes: string | null;
  admin_notes: string | null;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  order_items: AdminOrderItem[];
};

const ADMIN_ORDER_SELECT = `
  id, order_number, user_id, full_name, phone, email, address, city, region, notes,
  admin_notes, status, payment_method, payment_status, subtotal, delivery_fee, total, created_at,
  order_items ( id, product_id, product_name, quantity, unit_price, size, color,
    products ( brand_id, category_id ) )
`;

export const adminOrdersQuery = () =>
  queryOptions({
    queryKey: ["admin-orders"],
    queryFn: async (): Promise<AdminOrder[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select(ADMIN_ORDER_SELECT)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => {
        const order = row as unknown as AdminOrder;
        return {
          ...order,
          subtotal: Number(order.subtotal),
          delivery_fee: Number(order.delivery_fee),
          total: Number(order.total),
          order_items: (order.order_items ?? []).map((item) => ({
            ...item,
            unit_price: Number(item.unit_price),
          })),
        };
      });
    },
  });

export type CustomerRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  region: string | null;
  created_at: string;
};

export const customersQuery = () =>
  queryOptions({
    queryKey: ["admin-customers"],
    queryFn: async (): Promise<CustomerRow[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, city, region, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
