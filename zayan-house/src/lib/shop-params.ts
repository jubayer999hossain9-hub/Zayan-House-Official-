import type { ListParams, SortKey } from "./catalog";
import { SORT_OPTIONS } from "./sort-options";

type Raw = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function intParam(v: string | undefined): number | undefined {
  if (!v || !/^\d{1,7}$/.test(v)) return undefined;
  return Number(v);
}

export function parseShopParams(raw: Raw): ListParams {
  const q = one(raw.q)?.trim().slice(0, 100);
  const sort = SORT_OPTIONS.find((s) => s.value === one(raw.sort))?.value as SortKey | undefined;
  const filterRaw = one(raw.filter);
  const filter =
    one(raw.new) === "1" ? "new" : filterRaw === "featured" || filterRaw === "bestseller" || filterRaw === "new" ? filterRaw : undefined;
  return {
    q: q || undefined,
    category: one(raw.category)?.slice(0, 80) || undefined,
    min: intParam(one(raw.min)),
    max: intParam(one(raw.max)),
    size: one(raw.size)?.slice(0, 30) || undefined,
    color: one(raw.color)?.slice(0, 40) || undefined,
    sort,
    filter,
    page: intParam(one(raw.page)) || 1,
  };
}

/** Builds a query string from the active shop params (used by pagination and clear links). */
export function shopQuery(p: ListParams, overrides: Partial<Record<string, string | number | undefined>> = {}): string {
  const sp = new URLSearchParams();
  const base: Record<string, string | number | undefined> = {
    q: p.q, category: p.category, min: p.min, max: p.max, size: p.size, color: p.color,
    sort: p.sort, filter: p.filter, page: p.page && p.page > 1 ? p.page : undefined,
    ...overrides,
  };
  for (const [k, v] of Object.entries(base)) if (v !== undefined && v !== "") sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : "";
}
