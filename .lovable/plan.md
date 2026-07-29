## Stephans Collection — Phase 1

A premium, mobile-first sneaker storefront with a real database behind it, so you can upload your own products right away. Accounts, checkout and full admin analytics come in later phases.

### Design system
- Palette: black `#111111`, white `#FFFFFF`, light gray `#F5F5F5`, WhatsApp green `#25D366` as the only accent, all defined as semantic tokens with light + dark mode.
- Luxury/StockX feel: generous white space, rounded cards, subtle shadows, tight modern typography, card lift on hover, smooth fade/slide entrances.
- Mobile-first: sticky header, slide-out nav drawer, bottom-safe sticky action bars on product and cart.

### Pages in this phase
1. **Home** (`/`) — full-bleed hero with headline "Premium Sneakers at Affordable Prices", subtitle, and two CTAs (Shop Now, Chat on WhatsApp). Below: Featured Products, New Arrivals, Popular Brands, Why Choose Stephans Collection, Testimonials, Newsletter signup, Footer.
2. **Shop** (`/shop`) — responsive product grid with instant search, filters (brand, price range, size, gender, color, availability) in a mobile filter sheet, and sorting (Latest, Price ↑, Price ↓, Most Popular).
3. **Product details** (`/product/$slug`) — image gallery with zoom, description, brand, sizes, colors, price, delivery info, return policy, reviews section, related sneakers. Actions: Add to Cart, Buy Now, Order via WhatsApp.
4. **Cart** (`/cart`) — quantity updates, remove, subtotal, delivery fee, total; Continue Shopping, Checkout (placeholder for phase 2), WhatsApp Order.
5. **Brands / New Arrivals / About / Contact** — real routes with their own SEO metadata.
6. **Admin** (`/admin`) — password-protected via Cloud auth: add/edit/delete products, multi-image upload to Cloud storage, stock and price management, brand & category management. Enough to get your catalogue live.

### Product card
Large lazy-loaded image, brand mark, name, selling price (with strikethrough + discount badge when applicable), size chips, stock status, favourite heart, Quick View, Add to Cart, Order on WhatsApp.

### WhatsApp ordering
Every product and the cart deep-link to `wa.me/233508928908` with a pre-filled message:
```text
Hello Stephans Collection,
I'm interested in this sneaker.
Product: <name>
Price: GHS <price>
Size: <selected size>
Is it still available?
```

### Data (Lovable Cloud)
Tables: `brands`, `categories`, `products`, `product_images`, `reviews`, plus `admin` role table (roles kept in a separate `user_roles` table for security). Orders, customers, wishlist and cart tables are created now too so phase 2 plugs straight in.

Each product row carries: id, name, slug, brand, category, description, supplier price, selling price, markup, sizes, colors, stock, is_featured, is_new, tags, SEO title/description, ai_caption, created_at, updated_at — so AI importing and auto-markup can be layered on later with no migration churn.

Public reads are open (anon SELECT on catalogue tables); all writes require an authenticated admin. Images live in a public Cloud storage bucket.

### Technical notes
- Stack stays TanStack Start + React + TypeScript + Tailwind v4 (this project's router, not React Router — same routing capability).
- Cart and wishlist persist in local storage this phase; they migrate to the database when accounts land.
- Lazy images, per-route SEO metadata, semantic HTML, alt text, keyboard-accessible controls.
- Paystack/checkout, customer accounts, order history, saved addresses and analytics are deliberately deferred to phase 2.

### Not included in phase 1
Checkout + Paystack, customer registration/login, order management, coupons, loyalty, PWA, delivery tracking.