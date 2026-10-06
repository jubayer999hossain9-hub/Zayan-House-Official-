import { eq } from "drizzle-orm";
import { db } from "@/db";
import { homeMedia } from "@/db/schema-home";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return new Response("Not found", { status: 404 });

  const [row] = await db.select().from(homeMedia).where(eq(homeMedia.id, id)).limit(1);
  if (!row) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(Buffer.from(row.data, "base64")), {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
