import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listAdminProducts } from "@/lib/admin-products.functions";

export type ProductImage = {
  id: string;
  url: string;
  alt: string | null;
  position: number;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_featured: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand_id: string | null;
  category_id: string | null;
  supplier_price?: number;
  selling_price: number;
  compare_at_price: number | null;
  sizes: string[];
  colors: string[];
  gender: string;
  stock: number;
  is_featured: boolean;
  is_new: boolean;
  is_active: boolean;
  popularity: number;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  ai_caption: string | null;
  created_at: string;
  brands: Brand | null;
  categories: Category | null;
  product_images: ProductImage[];
};

const PRODUCT_SELECT = `
  id, name, slug, description, brand_id, category_id, selling_price,
  compare_at_price, sizes, colors, gender, stock, is_featured, is_new, is_active,
  popularity, tags, seo_title, seo_description, ai_caption, created_at,
  brands ( id, name, slug, logo_url, is_featured ),
  categories ( id, name, slug, image_url ),
  product_images ( id, url, alt, position )
`;

function normalize(row: Record<string, unknown>): Product {
  const p = row as unknown as Product;
  return {
    ...p,
    selling_price: Number(p.selling_price),
    ...(p.supplier_price === undefined
      ? {}
      : { supplier_price: Number(p.supplier_price) }),
    compare_at_price:
      p.compare_at_price === null ? null : Number(p.compare_at_price),
    sizes: p.sizes ?? [],
    colors: p.colors ?? [],
    tags: p.tags ?? [],
    product_images: (p.product_images ?? []).sort(
      (a, b) => a.position - b.position,
    ),
  };
}

export function primaryImage(product: Product) {
  return product.product_images[0]?.url ?? null;
}

export const productsQuery = () =>
  queryOptions({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(normalize);
    },
  });

export const adminProductsQuery = () =>
  queryOptions({
    queryKey: ["admin-products"],
    queryFn: async (): Promise<Product[]> => {
      const rows = await listAdminProducts();
      return rows.map((row) => normalize(row as unknown as Record<string, unknown>));
    },
  });

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? normalize(data) : null;
    },
  });

export const brandsQuery = () =>
  queryOptions({
    queryKey: ["brands"],
    queryFn: async (): Promise<Brand[]> => {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name, slug, logo_url, is_featured")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, image_url")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

export const reviewsQuery = (productId: string | undefined) =>
  queryOptions({
    queryKey: ["reviews", productId],
    enabled: Boolean(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, author_name, rating, comment, created_at")
        .eq("product_id", productId!)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export type ReviewStat = { count: number; average: number };

export const reviewStatsQuery = () =>
  queryOptions({
    queryKey: ["review-stats"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Record<string, ReviewStat>> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("product_id, rating")
        .eq("is_approved", true);
      if (error) throw error;
      const totals: Record<string, { sum: number; count: number }> = {};
      for (const row of data ?? []) {
        const entry = (totals[row.product_id] ??= { sum: 0, count: 0 });
        entry.sum += row.rating;
        entry.count += 1;
      }
      return Object.fromEntries(
        Object.entries(totals).map(([id, t]) => [
          id,
          { count: t.count, average: t.sum / t.count },
        ]),
      );
    },
  });
