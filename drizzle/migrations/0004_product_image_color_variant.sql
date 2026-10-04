ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS color text;
GRANT SELECT (color) ON public.product_images TO anon, authenticated;
GRANT INSERT (color), UPDATE (color) ON public.product_images TO authenticated;