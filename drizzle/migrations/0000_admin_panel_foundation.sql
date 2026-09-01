-- 1. Extra admin roles (additive; existing 'admin'/'customer' untouched)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';

-- 2. Role ranking helpers (text comparison keeps this safe alongside the ALTER TYPE above)
CREATE OR REPLACE FUNCTION public.admin_rank(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(
    CASE ur.role::text
      WHEN 'super_admin' THEN 4
      WHEN 'admin' THEN 3
      WHEN 'manager' THEN 2
      WHEN 'staff' THEN 1
      ELSE 0
    END), 0)
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.has_min_rank(_user_id uuid, _rank integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.admin_rank(_user_id) >= _rank
$$;

REVOKE ALL ON FUNCTION public.admin_rank(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_min_rank(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_rank(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_min_rank(uuid, integer) TO authenticated, service_role;

-- 3. Per-size stock
CREATE TABLE public.product_size_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, size)
);
CREATE INDEX product_size_stock_product_idx ON public.product_size_stock(product_id);

GRANT SELECT ON public.product_size_stock TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_size_stock TO authenticated;
GRANT ALL ON public.product_size_stock TO service_role;

ALTER TABLE public.product_size_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Size stock is public" ON public.product_size_stock
  FOR SELECT USING (true);
CREATE POLICY "Staff manage size stock" ON public.product_size_stock
  FOR ALL TO authenticated
  USING (public.has_min_rank(auth.uid(), 1))
  WITH CHECK (public.has_min_rank(auth.uid(), 1));

CREATE OR REPLACE FUNCTION public.sync_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid uuid := COALESCE(NEW.product_id, OLD.product_id);
BEGIN
  UPDATE public.products p
  SET stock = COALESCE((
    SELECT SUM(s.quantity) FROM public.product_size_stock s WHERE s.product_id = pid
  ), 0)
  WHERE p.id = pid
    AND EXISTS (SELECT 1 FROM public.product_size_stock s WHERE s.product_id = pid);
  RETURN NULL;
END; $$;

CREATE TRIGGER product_size_stock_sync
AFTER INSERT OR UPDATE OR DELETE ON public.product_size_stock
FOR EACH ROW EXECUTE FUNCTION public.sync_product_stock();

CREATE TRIGGER product_size_stock_updated_at
BEFORE UPDATE ON public.product_size_stock
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Admin activity log
CREATE TABLE public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_label text,
  action text NOT NULL,
  entity text,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_activity_log_created_idx ON public.admin_activity_log(created_at DESC);

GRANT SELECT, INSERT ON public.admin_activity_log TO authenticated;
GRANT ALL ON public.admin_activity_log TO service_role;

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins read activity" ON public.admin_activity_log
  FOR SELECT TO authenticated
  USING (public.has_min_rank(auth.uid(), 4));
CREATE POLICY "Staff write activity" ON public.admin_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (public.has_min_rank(auth.uid(), 1) AND actor_id = auth.uid());

-- 5. Store settings (key/value). Keys prefixed 'private_' are admin-only.
CREATE TABLE public.store_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public settings are readable" ON public.store_settings
  FOR SELECT USING (key NOT LIKE 'private_%');
CREATE POLICY "Admins read all settings" ON public.store_settings
  FOR SELECT TO authenticated
  USING (public.has_min_rank(auth.uid(), 3));
CREATE POLICY "Admins write settings" ON public.store_settings
  FOR ALL TO authenticated
  USING (public.has_min_rank(auth.uid(), 3))
  WITH CHECK (public.has_min_rank(auth.uid(), 3));

CREATE TRIGGER store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Widen existing staff-facing policies to the new roles (keeps admin working)
CREATE POLICY "Staff read all products" ON public.products
  FOR SELECT TO authenticated USING (public.has_min_rank(auth.uid(), 1));
CREATE POLICY "Staff manage orders" ON public.orders
  FOR ALL TO authenticated
  USING (public.has_min_rank(auth.uid(), 1))
  WITH CHECK (public.has_min_rank(auth.uid(), 1));
CREATE POLICY "Staff read order items" ON public.order_items
  FOR SELECT TO authenticated USING (public.has_min_rank(auth.uid(), 1));
CREATE POLICY "Staff read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_min_rank(auth.uid(), 2));
CREATE POLICY "Managers manage products" ON public.products
  FOR ALL TO authenticated
  USING (public.has_min_rank(auth.uid(), 2))
  WITH CHECK (public.has_min_rank(auth.uid(), 2));
CREATE POLICY "Managers manage product images" ON public.product_images
  FOR ALL TO authenticated
  USING (public.has_min_rank(auth.uid(), 2))
  WITH CHECK (public.has_min_rank(auth.uid(), 2));
CREATE POLICY "Managers manage reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (public.has_min_rank(auth.uid(), 2))
  WITH CHECK (public.has_min_rank(auth.uid(), 2));