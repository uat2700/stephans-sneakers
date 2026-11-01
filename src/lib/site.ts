export const SITE = {
  name: "Stephans Collection",
  tagline: "Premium Sneakers & Style at Affordable Prices",
  description:
    "Shop premium sneakers, clothing and accessories from top brands with fast delivery across Ghana.",
  whatsappNumber: "233508928908",
  email: "hello@stephanscollection.com",
  currency: "GHS",
  deliveryFee: 30,
  freeDeliveryFrom: 1000,
} as const;

export const REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Central",
  "Eastern",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Bono",
  "Ahafo",
  "Bono East",
  "Oti",
  "Savannah",
  "North East",
  "Western North",
];

export const SHOE_SIZES = ["36","37","38","39","40","41","42","43","44","45","46","47"];
export const CLOTHING_SIZES = ["XS","S","M","L","XL","XXL"];
export const ACCESSORY_SIZES = ["One size"];

export const SIZE_GROUPS = [
  { label: "Shoes (EU)", sizes: SHOE_SIZES },
  { label: "Clothing", sizes: CLOTHING_SIZES },
  { label: "Other", sizes: ACCESSORY_SIZES },
];

/** Legacy shoe-size list kept for existing callers. */
export const SIZE_OPTIONS = SHOE_SIZES;

export const COLOR_OPTIONS = [
  "Black",
  "White",
  "Grey",
  "Red",
  "Blue",
  "Green",
  "Brown",
  "Beige",
  "Multicolour",
];

export const GENDER_OPTIONS = ["men", "women", "unisex", "kids"];
