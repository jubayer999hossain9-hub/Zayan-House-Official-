import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { db } from "@/db";
import { media } from "@/db/schema";
import { detectImageType } from "@/lib/image-type";

export const dynamic = "force-dynamic";
const MAX_BYTES = 3 * 1024 * 1024;

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return NextResponse.json({ error: "Blocked." }, { status: 403 });

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    file = f instanceof File ? f : null;
  } catch {
    return NextResponse.json({ error: "Could not read the upload." }, { status: 400 });
  }
  if (!file || file.size === 0) return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image is too large (maximum 3 MB)." }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) return NextResponse.json({ error: "Only JPG, PNG or WebP images are allowed." }, { status: 415 });

  const [row] = await db.insert(media).values({ data: Buffer.from(bytes), contentType: type, size: bytes.length }).returning({ id: media.id });
  return NextResponse.json({ url: `/media/${row.id}` });
}
