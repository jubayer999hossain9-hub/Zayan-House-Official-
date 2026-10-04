/* Default values for every site setting. The database `settings` table overrides these. */
export const SETTING_DEFAULTS = {
  general: {
    siteName: "Zayan House",
    tagline: "Elegance in every detail",
    contactEmail: "",
    contactPhone: "",
    address: "Dhaka, Bangladesh",
  },
  announcement: {
    enabled: true,
    text: "Cash on Delivery available across Bangladesh",
  },
  whatsapp: {
    number: "",
    message: "Assalamu alaikum, I would like to know more about Zayan House products.",
  },
  social: {
    facebook: "",
    instagram: "",
  },
  payment: {
    codEnabled: true,
    codInstructions: "Pay in cash when your order is delivered.",
  },
  orders: {
    orderPrefix: "ZH",
  },
  inventory: {
    lowStockThreshold: 5,
  },
  hero: {
    s1Eyebrow: "Premium Women's Fashion",
    s1Title: "Elegance in Every",
    s1Accent: "Detail",
    s1Text: "Discover our latest women's collection: kurti, saree, three piece and party wear, crafted to be worn and loved.",
    s1Button: "Explore Collections",
    s1Link: "/shop",
    s2Eyebrow: "Just Arrived",
    s2Title: "Fresh Styles for the",
    s2Accent: "Season",
    s2Text: "Meet our newest pieces, chosen for beautiful fabric, a refined finish and everyday comfort.",
    s2Button: "See New Arrivals",
    s2Link: "/shop?new=1",
    s3Eyebrow: "Festive Edit",
    s3Title: "Dressed for Every",
    s3Accent: "Celebration",
    s3Text: "From quiet family gatherings to grand occasions, find the piece that feels like you.",
    s3Button: "Shop Party Wear",
    s3Link: "/category/party-wear",
  },
  promo: {
    enabled: true,
    eyebrow: "Festive Edit",
    title: "Dressed for every celebration",
    text: "Find the piece that feels like you.",
    button: "Shop Party Wear",
    link: "/category/party-wear",
  },
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type SiteSettings = { [K in SettingKey]: { -readonly [P in keyof (typeof SETTING_DEFAULTS)[K]]: (typeof SETTING_DEFAULTS)[K][P] extends boolean ? boolean : (typeof SETTING_DEFAULTS)[K][P] extends number ? number : string } };
