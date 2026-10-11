/* Colours for status pills (orders, payments, products, stock, coupons).
   Full class names are written out so Tailwind can see them. */
export const PILL_BASE =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-wider ring-1 ring-inset before:h-1.5 before:w-1.5 before:rounded-full before:bg-current";

export const TONES = {
  amber: "bg-amber-100 text-amber-800 ring-amber-300/60",
  blue: "bg-blue-100 text-blue-800 ring-blue-300/60",
  violet: "bg-violet-100 text-violet-800 ring-violet-300/60",
  indigo: "bg-indigo-100 text-indigo-800 ring-indigo-300/60",
  green: "bg-emerald-100 text-emerald-800 ring-emerald-300/60",
  red: "bg-rose-100 text-rose-800 ring-rose-300/60",
  orange: "bg-orange-100 text-orange-800 ring-orange-300/60",
  gray: "bg-stone-200/70 text-stone-700 ring-stone-300/70",
} as const;

export type Tone = keyof typeof TONES;

export const STATUS_TONE: Record<string, Tone> = {
  pending: "amber",
  confirmed: "blue",
  processing: "violet",
  shipped: "indigo",
  delivered: "green",
  cancelled: "red",
  paid: "green",
  failed: "red",
  refunded: "gray",
  active: "green",
  draft: "amber",
  archived: "gray",
};
