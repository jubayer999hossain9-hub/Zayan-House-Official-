import "dotenv/config";
import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { bdDistricts, bdThanas, bdPostOffices } from "./schema-home";

type Row = {
  district: string; districtBn?: string;
  thana: string; thanaBn?: string;
  postOffice: string; postOfficeBn?: string; postCode?: string;
};

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? true : undefined,
  });
  const db = drizzle(pool);
  const rows: Row[] = JSON.parse(readFileSync("data/bd-locations.json", "utf8"));

  const districtIds = new Map<string, number>();
  const thanaIds = new Map<string, number>();
  const offices: (typeof bdPostOffices.$inferInsert)[] = [];

  for (const r of rows) {
    const dName = r.district.trim();
    const tName = r.thana.trim();

    let districtId = districtIds.get(dName);
    if (!districtId) {
      const [d] = await db
        .insert(bdDistricts)
        .values({ name: dName, nameBn: r.districtBn ?? null })
        .onConflictDoUpdate({ target: bdDistricts.name, set: { name: dName } })
        .returning({ id: bdDistricts.id });
      districtId = d.id;
      districtIds.set(dName, districtId);
    }

    const key = `${districtId}:${tName}`;
    let thanaId = thanaIds.get(key);
    if (!thanaId) {
      const [t] = await db
        .insert(bdThanas)
        .values({ districtId, name: tName, nameBn: r.thanaBn ?? null })
        .onConflictDoUpdate({ target: [bdThanas.districtId, bdThanas.name], set: { name: tName } })
        .returning({ id: bdThanas.id });
      thanaId = t.id;
      thanaIds.set(key, thanaId);
    }

    offices.push({
      thanaId,
      name: r.postOffice.trim(),
      nameBn: r.postOfficeBn ?? null,
      postCode: (r.postCode ?? "").trim(),
    });
  }

  for (let i = 0; i < offices.length; i += 500) {
    await db.insert(bdPostOffices).values(offices.slice(i, i + 500)).onConflictDoNothing();
  }

  console.log(`Done: ${districtIds.size} districts, ${thanaIds.size} thanas, ${offices.length} post offices.`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
