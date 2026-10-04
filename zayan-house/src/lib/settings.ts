import "server-only";
import { cache } from "react";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { SETTING_DEFAULTS, type SiteSettings, type SettingKey } from "./settings-defaults";

/** Loads all settings (database values merged over defaults). Cached per request. */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  const result = structuredClone(SETTING_DEFAULTS) as unknown as SiteSettings;
  try {
    const rows = await db.select().from(settings);
    for (const row of rows) {
      const key = row.key as SettingKey;
      if (key in result && row.value && typeof row.value === "object") {
        Object.assign(result[key], row.value);
      }
    }
  } catch (error) {
    console.error("Could not load settings, using defaults:", error);
  }
  // The WHATSAPP_NUMBER env value is only a starting point until the admin sets one.
  if (!result.whatsapp.number && process.env.WHATSAPP_NUMBER) {
    result.whatsapp.number = process.env.WHATSAPP_NUMBER;
  }
  return result;
});
