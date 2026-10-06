export const VIDEO_POSITIONS = [
  { value: "after_banner", label: "Right after the top banner" },
  { value: "after_categories", label: "After Shop by Category" },
  { value: "after_collections", label: "After Featured Collections" },
  { value: "after_new_arrivals", label: "After New Arrivals" },
  { value: "after_featured", label: "After Featured Products" },
  { value: "after_best_sellers", label: "After Best Sellers" },
] as const;

export type VideoPosition = (typeof VIDEO_POSITIONS)[number]["value"];

export const VIDEO_POSITION_VALUES = VIDEO_POSITIONS.map((p) => p.value) as [
  VideoPosition,
  ...VideoPosition[],
];
