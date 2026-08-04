CREATE OR REPLACE FUNCTION public.increment_product_views(_product_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.products
  SET popularity = popularity + 1
  WHERE id = _product_id AND is_active = true;
$$;

REVOKE ALL ON FUNCTION public.increment_product_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_product_views(uuid) TO anon, authenticated;