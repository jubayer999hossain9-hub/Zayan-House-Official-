/**
 * Seed script.
 *   npm run db:seed        -> ONLY the essentials the shop needs to run
 *                             (categories, delivery zones, default settings). Safe for production.
 *   npm run db:seed:demo   -> essentials + DEMO products and a DEMO coupon for development.
 *                             All demo products have a SKU starting with "DEMO-".
 *                             Remove them any time with: npm run db:remove-demo
 * Both commands are safe to run more than once.
 */
import { sql } from "drizzle-orm";
import { connectScript } from "./standalone";
import {
  categories,
  deliveryZones,
  settings,
  products,
  productVariants,
  coupons,
} from "./schema";
import { SETTING_DEFAULTS } from "../lib/settings-defaults";

const withDemo = process.argv.includes("--demo");

const CATEGORY_SEED = [
  { name: "Three Piece", slug: "three-piece", description: "Complete three-piece sets, beautifully coordinated." },
  { name: "Kurti", slug: "kurti", description: "Everyday and festive kurtis in refined fabrics." },
  { name: "Saree", slug: "saree", description: "Timeless sarees for every occasion." },
  { name: "Party Wear", slug: "party-wear", description: "Statement pieces for celebrations." },
  { name: "Casual Wear", slug: "casual-wear", description: "Comfortable, elegant everyday styles." },
  { name: "New Collection", slug: "new-collection", description: "The latest arrivals from Zayan House." },
];

async function main() {
  const { db, pool } = connectScript();

  await db
    .insert(categories)
    .values(CATEGORY_SEED.map((c, i) => ({ ...c, displayOrder: i + 1 })))
    .onConflictDoNothing({ target: categories.slug });

  await db
    .insert(deliveryZones)
    .values([
      { name: "Inside Dhaka", slug: "inside-dhaka", charge: 70, sortOrder: 1 },
      { name: "Outside Dhaka", slug: "outside-dhaka", charge: 130, sortOrder: 2 },
    ])
    .onConflictDoNothing({ target: deliveryZones.slug });

  await db
    .insert(settings)
    .values(Object.entries(SETTING_DEFAULTS).map(([key, value]) => ({ key, value })))
    .onConflictDoNothing({ target: settings.key });

  // Phase 1 shipped a default announcement that promised free delivery over ৳5,000, which no zone offers.
  await db.execute(sql`update settings set value = ${JSON.stringify(SETTING_DEFAULTS.announcement)}::jsonb
    where key = 'announcement' and value->>'text' like 'Free delivery on orders over%'`);

  console.log("Essentials seeded: categories, delivery zones, default settings.");

  if (withDemo) {
    const cats = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
    const catId = (slug: string) => cats.find((c) => c.slug === slug)?.id ?? null;

    const demo = [
      { sku: "DEMO-KRT-001", name: "Embroidered Cotton Kurti", slug: "demo-embroidered-cotton-kurti", cat: "kurti", price: 1650, sale: null, feat: true, best: true, isNew: false, colors: [["Ivory", "#F3EEDF"], ["Emerald", "#0F3D35"]] },
      { sku: "DEMO-KRT-002", name: "Kurti with Dupatta Set", slug: "demo-kurti-with-dupatta-set", cat: "kurti", price: 2300, sale: 1990, feat: true, best: false, isNew: true, colors: [["Rose", "#C9A0A0"], ["Sage", "#9AA88F"]] },
      { sku: "DEMO-SAR-001", name: "Soft Cotton Saree", slug: "demo-soft-cotton-saree", cat: "saree", price: 2100, sale: null, feat: false, best: true, isNew: false, colors: [["Champagne", "#C8A96B"], ["Deep Green", "#0F3D35"]] },
      { sku: "DEMO-SAR-002", name: "Festive Party Saree", slug: "demo-festive-party-saree", cat: "saree", price: 4500, sale: 3990, feat: true, best: false, isNew: true, colors: [["Burgundy", "#6B1F2A"]] },
      { sku: "DEMO-TPC-001", name: "Printed Three Piece", slug: "demo-printed-three-piece", cat: "three-piece", price: 2800, sale: null, feat: false, best: true, isNew: true, colors: [["Teal", "#1F5C55"], ["Sand", "#D9C9A8"]] },
      { sku: "DEMO-PTY-001", name: "Embellished Party Gown", slug: "demo-embellished-party-gown", cat: "party-wear", price: 4200, sale: null, feat: true, best: false, isNew: true, colors: [["Midnight", "#17201E"]] },
      { sku: "DEMO-CAS-001", name: "Everyday Linen Kurti", slug: "demo-everyday-linen-kurti", cat: "casual-wear", price: 1400, sale: 1190, feat: false, best: false, isNew: false, colors: [["Cream", "#FCFAF5"], ["Olive", "#7B7F4F"]] },
      { sku: "DEMO-NEW-001", name: "Signature Georgette Set", slug: "demo-signature-georgette-set", cat: "new-collection", price: 3200, sale: null, feat: true, best: false, isNew: true, colors: [["Ivory", "#F3EEDF"]] },
    ];
    const sizes = ["S", "M", "L", "XL"];

    for (const p of demo) {
      const [row] = await db
        .insert(products)
        .values({
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          shortDescription: "DEMO product for development. Replace or remove before launch.",
          description: "This is demo data created by `npm run db:seed:demo`. Remove it with `npm run db:remove-demo`.",
          categoryId: catId(p.cat),
          regularPrice: p.price,
          salePrice: p.sale,
          status: "active",
          isFeatured: p.feat,
          isBestseller: p.best,
          isNewArrival: p.isNew,
        })
        .onConflictDoNothing({ target: products.sku })
        .returning({ id: products.id });
      if (!row) continue; // already seeded
      const variantRows = p.colors.flatMap(([color, hex]) =>
        sizes.map((size) => ({
          productId: row.id,
          sku: `${p.sku}-${color.replace(/\s+/g, "").toUpperCase().slice(0, 4)}-${size}`,
          size,
          color,
          colorHex: hex,
          stock: 10,
        })),
      );
      await db.insert(productVariants).values(variantRows).onConflictDoNothing({ target: productVariants.sku });
    }

    await db
      .insert(coupons)
      .values({
        code: "DEMO10",
        description: "DEMO coupon: 10% off, minimum order ৳1,500",
        discountType: "percent",
        discountValue: 10,
        minOrderAmount: 1500,
        maxDiscountAmount: 500,
      })
      .onConflictDoNothing();

    await db
      .insert(settings)
      .values({
        key: "testimonials",
        value: {
          items: [
            { name: "Demo Customer A", city: "Dhaka", text: "DEMO review: beautiful fabric and a perfect fit." },
            { name: "Demo Customer B", city: "Chattogram", text: "DEMO review: fast delivery and lovely packaging." },
            { name: "Demo Customer C", city: "Sylhet", text: "DEMO review: elegant design, exactly as shown." },
          ],
        },
      })
      .onConflictDoNothing({ target: settings.key });

    console.log("DEMO data seeded: 8 demo products (SKU starts with DEMO-), coupon DEMO10 and 3 demo testimonials.");
  }

  await pool.end();
}

main().catch((e) => {
  console.error("Seeding failed:", e);
  process.exit(1);
});
