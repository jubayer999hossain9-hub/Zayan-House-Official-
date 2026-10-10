/* Theme helpers shared by the storefront and the admin Theme editor.
   No server-only code here, so it can be used in client components too. */

export const THEME_COLOR_FIELDS = [
  { key: "green", label: "Main colour", hint: "Header bar, buttons, headings" },
  { key: "greenDark", label: "Main colour (darker)", hint: "Button hover, footer" },
  { key: "greenLight", label: "Main colour (lighter)", hint: "Soft highlights" },
  { key: "gold", label: "Accent colour", hint: "Small highlights, badges" },
  { key: "goldDark", label: "Accent colour (darker)", hint: "Italic words, hover" },
  { key: "goldLight", label: "Accent colour (lighter)", hint: "Soft accent backgrounds" },
  { key: "ivory", label: "Page background", hint: "Main background of the website" },
  { key: "cream", label: "Card background", hint: "Cards, boxes, form fields" },
  { key: "sand", label: "Soft background", hint: "Quiet sections" },
  { key: "charcoal", label: "Text colour", hint: "Normal text" },
  { key: "muted", label: "Light text colour", hint: "Small grey text" },
  { key: "line", label: "Border colour", hint: "Thin lines around boxes" },
] as const;

export type ThemeColorKey = (typeof THEME_COLOR_FIELDS)[number]["key"];

export const HEADING_FONTS = [
  { id: "cormorant", label: "Cormorant Garamond (Zayan default)", css: '"Cormorant Garamond", "Kalpurush", Georgia, serif', gf: "" },
  { id: "playfair", label: "Playfair Display", css: '"Playfair Display", "Kalpurush", Georgia, serif', gf: "Playfair+Display:ital,wght@0,500;0,600;0,700;1,500" },
  { id: "lora", label: "Lora", css: '"Lora", "Kalpurush", Georgia, serif', gf: "Lora:ital,wght@0,500;0,600;0,700;1,500" },
  { id: "marcellus", label: "Marcellus", css: '"Marcellus", "Kalpurush", Georgia, serif', gf: "Marcellus" },
  { id: "libre", label: "Libre Baskerville", css: '"Libre Baskerville", "Kalpurush", Georgia, serif', gf: "Libre+Baskerville:ital,wght@0,400;0,700;1,400" },
  { id: "cinzel", label: "Cinzel", css: '"Cinzel", "Kalpurush", Georgia, serif', gf: "Cinzel:wght@500;600;700" },
] as const;

export const BODY_FONTS = [
  { id: "inter", label: "Inter (Zayan default)", css: '"Inter Variable", "Kalpurush", system-ui, sans-serif', gf: "" },
  { id: "poppins", label: "Poppins", css: '"Poppins", "Kalpurush", system-ui, sans-serif', gf: "Poppins:wght@400;500;600" },
  { id: "montserrat", label: "Montserrat", css: '"Montserrat", "Kalpurush", system-ui, sans-serif', gf: "Montserrat:wght@400;500;600" },
  { id: "lato", label: "Lato", css: '"Lato", "Kalpurush", system-ui, sans-serif', gf: "Lato:wght@400;700" },
  { id: "dmsans", label: "DM Sans", css: '"DM Sans", "Kalpurush", system-ui, sans-serif', gf: "DM+Sans:wght@400;500;600" },
  { id: "nunito", label: "Nunito Sans", css: '"Nunito Sans", "Kalpurush", system-ui, sans-serif', gf: "Nunito+Sans:wght@400;600;700" },
] as const;

export const HEADING_FONT_IDS = ["cormorant", "playfair", "lora", "marcellus", "libre", "cinzel"] as const;
export const BODY_FONT_IDS = ["inter", "poppins", "montserrat", "lato", "dmsans", "nunito"] as const;
export const BUTTON_STYLE_IDS = ["pill", "rounded", "square"] as const;
export const CARD_STYLE_IDS = ["soft", "round", "sharp"] as const;

export const BUTTON_STYLES = [
  { id: "pill", label: "Pill (fully round)", radius: "999px" },
  { id: "rounded", label: "Rounded", radius: "10px" },
  { id: "square", label: "Square", radius: "2px" },
] as const;

export const CARD_STYLES = [
  { id: "soft", label: "Soft corners", radius: "16px", small: "12px", field: "10px" },
  { id: "round", label: "Very round", radius: "26px", small: "18px", field: "16px" },
  { id: "sharp", label: "Sharp corners", radius: "2px", small: "2px", field: "2px" },
] as const;

export type ThemeValues = Record<ThemeColorKey, string> & {
  headingFont: string;
  bodyFont: string;
  buttonStyle: string;
  cardStyle: string;
};

export const ZAYAN_CLASSIC: ThemeValues = {
  green: "#0f3d35", greenDark: "#0a2b25", greenLight: "#17584d",
  gold: "#c8a96b", goldDark: "#a98a4d", goldLight: "#e6d3a3",
  ivory: "#f8f5ee", cream: "#fcfaf5", sand: "#efe6d3",
  charcoal: "#17201e", muted: "#6f746f", line: "#e6dfd0",
  headingFont: "cormorant", bodyFont: "inter", buttonStyle: "pill", cardStyle: "soft",
};

export const THEME_PRESETS: { id: string; label: string; values: ThemeValues }[] = [
  { id: "classic", label: "Zayan Classic (green and gold)", values: ZAYAN_CLASSIC },
  {
    id: "emerald-pearl", label: "Emerald and pearl",
    values: { ...ZAYAN_CLASSIC, green: "#0b4a3f", greenDark: "#06322a", greenLight: "#1a6b5c", gold: "#d4b483", goldDark: "#b08d57", goldLight: "#efdfbd", ivory: "#f6f7f3", cream: "#fdfdfb", sand: "#e8ebe2", line: "#dde2d6", headingFont: "playfair" },
  },
  {
    id: "rose-gold", label: "Rose and gold",
    values: { ...ZAYAN_CLASSIC, green: "#6b2c3e", greenDark: "#4d1d2b", greenLight: "#8a4157", gold: "#c9a27a", goldDark: "#a67c52", goldLight: "#ecd5bd", ivory: "#faf4f1", cream: "#fffbf9", sand: "#f1e3dc", charcoal: "#2a1c20", muted: "#7a6a6e", line: "#ead9d2", headingFont: "lora" },
  },
  {
    id: "royal-navy", label: "Royal navy and champagne",
    values: { ...ZAYAN_CLASSIC, green: "#1c2f4f", greenDark: "#111e35", greenLight: "#2d4770", gold: "#c8ab70", goldDark: "#a58a52", goldLight: "#e8d8ae", ivory: "#f6f5f1", cream: "#fcfbf8", sand: "#e9e6dc", charcoal: "#1a2230", muted: "#6c7380", line: "#dedbd0", headingFont: "marcellus" },
  },
  {
    id: "noir-gold", label: "Noir and gold",
    values: { ...ZAYAN_CLASSIC, green: "#1f1f1f", greenDark: "#0f0f0f", greenLight: "#3a3a3a", gold: "#c9a24a", goldDark: "#a8832f", goldLight: "#ead9a6", ivory: "#f7f5f0", cream: "#fdfcf9", sand: "#ece8de", charcoal: "#161616", muted: "#6e6e6e", line: "#e3ded2", headingFont: "cinzel", buttonStyle: "square", cardStyle: "sharp" },
  },
];

export const HEX = /^#[0-9a-fA-F]{6}$/;

function pick<T extends { id: string }>(list: readonly T[], id: string, fallback: T): T {
  return list.find((x) => x.id === id) ?? fallback;
}

/** Turns saved theme values into a safe block of CSS variables. Bad values fall back to Zayan Classic. */
export function themeToCssVars(t: Partial<ThemeValues> | undefined): string {
  const v = { ...ZAYAN_CLASSIC, ...(t ?? {}) } as ThemeValues;
  const lines: string[] = [];
  for (const f of THEME_COLOR_FIELDS) {
    const val = HEX.test(String(v[f.key])) ? String(v[f.key]) : ZAYAN_CLASSIC[f.key];
    const cssName = f.key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
    lines.push(`--color-${cssName}:${val};`);
  }
  const heading = pick(HEADING_FONTS, v.headingFont, HEADING_FONTS[0]);
  const body = pick(BODY_FONTS, v.bodyFont, BODY_FONTS[0]);
  const btn = pick(BUTTON_STYLES, v.buttonStyle, BUTTON_STYLES[0]);
  const card = pick(CARD_STYLES, v.cardStyle, CARD_STYLES[0]);
  lines.push(`--font-serif:${heading.css};`);
  lines.push(`--font-sans:${body.css};`);
  lines.push(`--btn-radius:${btn.radius};`);
  lines.push(`--card-radius:${card.radius};`);
  lines.push(`--card-radius-sm:${card.small};`);
  lines.push(`--field-radius:${card.field};`);
  return `:root{${lines.join("")}}`;
}

/** Google Fonts stylesheet link for the chosen fonts, or null when only built-in fonts are used. */
export function googleFontsHref(t: Partial<ThemeValues> | undefined): string | null {
  const v = { ...ZAYAN_CLASSIC, ...(t ?? {}) } as ThemeValues;
  const heading = pick(HEADING_FONTS, v.headingFont, HEADING_FONTS[0]);
  const body = pick(BODY_FONTS, v.bodyFont, BODY_FONTS[0]);
  const families = [heading.gf, body.gf].filter(Boolean);
  if (families.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join("&")}&display=swap`;
}
