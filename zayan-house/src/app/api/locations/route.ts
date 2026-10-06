import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bdDistricts, bdThanas, bdPostOffices } from "@/db/schema-home";

const CACHE = { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" };

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const parentId = Number(req.nextUrl.searchParams.get("parentId"));
  const hasParent = Number.isInteger(parentId) && parentId > 0;

  if (type === "districts") {
    const rows = await db
      .select({ id: bdDistricts.id, name: bdDistricts.name, nameBn: bdDistricts.nameBn })
      .from(bdDistricts)
      .orderBy(asc(bdDistricts.name));
    return NextResponse.json(rows, { headers: CACHE });
  }
  if (type === "thanas" && hasParent) {
    const rows = await db
      .select({ id: bdThanas.id, name: bdThanas.name, nameBn: bdThanas.nameBn })
      .from(bdThanas)
      .where(eq(bdThanas.districtId, parentId))
      .orderBy(asc(bdThanas.name));
    return NextResponse.json(rows, { headers: CACHE });
  }
  if (type === "postOffices" && hasParent) {
    const rows = await db
      .select({ id: bdPostOffices.id, name: bdPostOffices.name, nameBn: bdPostOffices.nameBn, hint: bdPostOffices.postCode })
      .from(bdPostOffices)
      .where(eq(bdPostOffices.thanaId, parentId))
      .orderBy(asc(bdPostOffices.name));
    return NextResponse.json(rows, { headers: CACHE });
  }
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
