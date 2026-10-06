import { NextResponse } from "next/server";
import { db } from "@/db";
import { homeMedia } from "@/db/schema-home";
import { assertHomeAdmin } from "@/lib/home/guard";

const MAX_BYTES = 3 * 1024 * 1024;

// Decide the type from the real file bytes, not the file name
function sniff(b: Buffer): string | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function POST(req: Request) {
  // Only accept uploads sent from this website itself
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await assertHomeAdmin();

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Picture is larger than 3 MB" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const mime = sniff(buf);
  if (!mime) {
    return NextResponse.json({ error: "Use a JPG, PNG or WebP picture" }, { status: 400 });
  }

  const [row] = await db
    .insert(homeMedia)
    .values({ mime, data: buf.toString("base64") })
    .returning({ id: homeMedia.id });

  return NextResponse.json({ url: `/api/home-media/${row.id}` });
}
