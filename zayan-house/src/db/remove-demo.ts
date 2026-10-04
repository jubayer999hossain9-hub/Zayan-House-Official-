/** Removes all demo products (SKU starting with DEMO-), the DEMO10 coupon and demo testimonials. Real data is untouched. */
import { like, sql } from "drizzle-orm";
import { connectScript } from "./standalone";
import { products, coupons, settings } from "./schema";

async function main() {
  const { db, pool } = connectScript();
  const removed = await db.delete(products).where(like(products.sku, "DEMO-%")).returning({ id: products.id });
  await db.delete(coupons).where(sql`upper(${coupons.code}) = 'DEMO10'`);
  await db.delete(settings).where(sql`${settings.key} = 'testimonials' and ${settings.value}::text like '%DEMO review%'`);
  console.log(`Removed ${removed.length} demo products, the DEMO10 coupon and the demo testimonials.`);
  await pool.end();
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
