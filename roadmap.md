# Roadmap — connect admin dashboard to storefront

## Done
- Admin foundation: roles, shell, dashboard, orders, customers, products, inventory, taxonomy, AI import, activity, settings
- Coupons table + per-size stock decrement on delivered orders (DB trigger)
- Store / delivery / homepage settings storage
- Admin panels: homepage & banners, promotions (coupons), reviews moderation

## In progress
- Settings panel: store contact, WhatsApp number & template, currency, hours, delivery regions/fees
- Storefront wiring: dynamic WhatsApp number, delivery fee from settings, homepage sections & banners, coupon at checkout, size availability from per-size stock

## Next
- Only approved reviews public (verify), analytics from real data (verify)
- Realtime refresh for products/orders where practical

## AI importer colour variants
- [x] AI returns model + colour per photo; same model groups into one product, same colour into one variant
- [x] Review screen: colour groups, rename colour, move photo to colour/product, merge products, low-confidence warning
- [x] Photos saved with colour; product page gallery switches by selected colour
- [x] Stock per colour + size (product_size_stock.color, colour-grouped inventory editor, per-colour size availability, colour-aware delivery decrement)
- [ ] Colour swatches on product cards, colour filter/search, duplicate detection vs existing products, import summary
