export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_label: string | null
          created_at: string
          details: Json
          entity: string | null
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_label?: string | null
          created_at?: string
          details?: Json
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_label?: string | null
          created_at?: string
          details?: Json
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          position: number
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          position?: number
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          position?: number
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_featured: boolean
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          color: string | null
          created_at: string
          id: string
          product_id: string
          quantity: number
          size: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          size?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          size?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          color: string | null
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          size: string | null
          unit_price: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          size?: string | null
          unit_price: number
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          size?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          admin_notes: string | null
          city: string
          created_at: string
          delivery_fee: number
          discount: number
          email: string | null
          full_name: string
          id: string
          notes: string | null
          order_number: string
          payment_method: string
          payment_status: string
          phone: string
          region: string
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          admin_notes?: string | null
          city: string
          created_at?: string
          delivery_fee?: number
          discount?: number
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_status?: string
          phone: string
          region: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          admin_notes?: string | null
          city?: string
          created_at?: string
          delivery_fee?: number
          discount?: number
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_status?: string
          phone?: string
          region?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          position: number
          product_id: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_size_stock: {
        Row: {
          id: string
          product_id: string
          quantity: number
          size: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity?: number
          size: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          size?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_size_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          ai_caption: string | null
          brand_id: string | null
          category_id: string | null
          colors: string[]
          compare_at_price: number | null
          created_at: string
          description: string | null
          gender: string
          id: string
          is_active: boolean
          is_archived: boolean
          is_best_seller: boolean
          is_featured: boolean
          is_new: boolean
          is_on_sale: boolean
          markup_percent: number | null
          name: string
          popularity: number
          selling_price: number
          seo_description: string | null
          seo_title: string | null
          sizes: string[]
          sku: string | null
          slug: string
          source: string | null
          stock: number
          supplier_price: number
          tags: string[]
          updated_at: string
        }
        Insert: {
          ai_caption?: string | null
          brand_id?: string | null
          category_id?: string | null
          colors?: string[]
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          gender?: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          is_best_seller?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_on_sale?: boolean
          markup_percent?: number | null
          name: string
          popularity?: number
          selling_price?: number
          seo_description?: string | null
          seo_title?: string | null
          sizes?: string[]
          sku?: string | null
          slug: string
          source?: string | null
          stock?: number
          supplier_price?: number
          tags?: string[]
          updated_at?: string
        }
        Update: {
          ai_caption?: string | null
          brand_id?: string | null
          category_id?: string | null
          colors?: string[]
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          gender?: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          is_best_seller?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_on_sale?: boolean
          markup_percent?: number | null
          name?: string
          popularity?: number
          selling_price?: number
          seo_description?: string | null
          seo_title?: string | null
          sizes?: string[]
          sku?: string | null
          slug?: string
          source?: string | null
          stock?: number
          supplier_price?: number
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_name: string
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean
          product_id: string
          rating: number
          user_id: string | null
        }
        Insert: {
          author_name: string
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id: string
          rating: number
          user_id?: string | null
        }
        Update: {
          author_name?: string
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id?: string
          rating?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_rank: { Args: { _user_id: string }; Returns: number }
      has_min_rank: {
        Args: { _rank: number; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_product_views: {
        Args: { _product_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "super_admin" | "manager" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer", "super_admin", "manager", "staff"],
    },
  },
} as const
