-- 1. Hide cost/margin columns from the Data API roles
REVOKE SELECT ON public.products FROM anon, authenticated;

GRANT SELECT (
  id, name, slug, description, brand_id, category_id, selling_price,
  compare_at_price, sizes, colors, gender, stock, is_featured, is_new,
  is_active, popularity, tags, seo_title, seo_description, ai_caption,
  source, created_at, updated_at
) ON public.products TO anon, authenticated;

-- 2. Storage policies: inline admin role check instead of calling has_role
DROP POLICY IF EXISTS "Admins upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete product images" ON storage.objects;

CREATE POLICY "Admins upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "Admins update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "Admins delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

-- 3. Remove direct API access to SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_product_views(uuid) FROM anon, authenticated;
