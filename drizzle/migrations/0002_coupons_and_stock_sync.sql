CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percent',
  value numeric NOT NULL DEFAULT 0,
  min_order numeric NOT NULL DEFAULT 0,
  max_discount numeric,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coupons_discount_type_check CHECK (discount_type IN ('percent','amount'))
);

GRANT SELECT ON public.coupons TO anon;
GRANT SELECT ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coupons are readable" ON public.coupons
  FOR SELECT USING (true);

CREATE POLICY "Managers manage coupons" ON public.coupons
  FOR ALL TO authenticated
  USING (public.has_min_rank(auth.uid(), 2))
  WITH CHECK (public.has_min_rank(auth.uid(), 2));

CREATE OR REPLACE FUNCTION public.redeem_coupon(_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE upper(code) = upper(_code);
$$;

REVOKE ALL ON FUNCTION public.redeem_coupon(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.decrement_size_stock_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'delivered' AND COALESCE(OLD.status, '') <> 'delivered' THEN
    UPDATE public.product_size_stock pss
    SET quantity = GREATEST(pss.quantity - oi.qty, 0)
    FROM (
      SELECT product_id, size, SUM(quantity) AS qty
      FROM public.order_items
      WHERE order_id = NEW.id AND product_id IS NOT NULL AND size IS NOT NULL
      GROUP BY product_id, size
    ) oi
    WHERE pss.product_id = oi.product_id AND pss.size = oi.size;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decrement_size_stock ON public.orders;
CREATE TRIGGER trg_decrement_size_stock
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.decrement_size_stock_on_delivery();

INSERT INTO public.store_settings (key, value) VALUES
  ('store', '{"name":"Stephans Collection","whatsapp_number":"233508928908","phone":"+233508928908","email":"hello@stephanscollection.com","currency":"GHS","hours":"Mon - Sat, 9am - 7pm","instagram":"","tiktok":"","facebook":"","whatsapp_template":"Hello Stephans Collection, I would like to know more about your sneakers."}'::jsonb),
  ('delivery', '{"default_fee":30,"free_from":1000,"regions":[]}'::jsonb),
  ('homepage', '{"hero_title":"Step into","hero_subtitle":"your next pair","hero_note":"","show_banners":true,"show_categories":true,"show_brands":true,"show_flash_sale":true,"show_featured":true,"show_new":true,"show_best_sellers":true,"show_trending":true,"show_testimonials":true,"show_instagram":true,"show_newsletter":true}'::jsonb)
ON CONFLICT (key) DO NOTHING;