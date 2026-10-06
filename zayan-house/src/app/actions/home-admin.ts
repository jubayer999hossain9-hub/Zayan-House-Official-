"use server";

import { revalidatePath } from "next/cache";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { homeBanners, homeVideo } from "@/db/schema-home";
import { assertHomeAdmin } from "@/lib/home/guard";
import { VIDEO_POSITION_VALUES } from "@/lib/home/positions";

type Result = { ok: true } | { ok: false; error: string };

const safeUrl = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) => v === "" || (v.startsWith("/") && !v.startsWith("//")) || v.startsWith("https://"),
      "Links must start with / or https://"
    );

const bannerSchema = z.object({
  imageUrl: safeUrl(500).refine((v) => v !== "", "Please upload a banner picture"),
  heading: z.string().trim().max(160),
  subtext: z.string().trim().max(300),
  buttonText: z.string().trim().max(60),
  buttonLink: safeUrl(300),
});

const videoSchema = z
  .object({
    videoUrl: safeUrl(500),
    posterUrl: safeUrl(500),
    title: z.string().trim().max(160),
    description: z.string().trim().max(600),
    isActive: z.boolean(),
    position: z.enum(VIDEO_POSITION_VALUES),
  })
  .refine((v) => !v.isActive || v.videoUrl !== "", "Add a video link before turning the section on");

const idSchema = z.number().int().positive();

function fail(error: z.ZodError): Result {
  return { ok: false, error: error.issues[0]?.message ?? "Invalid input" };
}

function done(): Result {
  revalidatePath("/");
  revalidatePath("/admin/home");
  return { ok: true };
}

export async function saveBanner(id: number | null, input: unknown): Promise<Result> {
  await assertHomeAdmin();
  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error);

  if (id === null) {
    const [row] = await db
      .select({ max: sql<number>`coalesce(max(${homeBanners.sortOrder}), 0)` })
      .from(homeBanners);
    await db.insert(homeBanners).values({ ...parsed.data, sortOrder: Number(row?.max ?? 0) + 1 });
  } else {
    if (!idSchema.safeParse(id).success) return { ok: false, error: "Invalid banner" };
    await db.update(homeBanners).set(parsed.data).where(eq(homeBanners.id, id));
  }
  return done();
}

export async function deleteBanner(id: number): Promise<Result> {
  await assertHomeAdmin();
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Invalid banner" };
  await db.delete(homeBanners).where(eq(homeBanners.id, id));
  return done();
}

export async function setBannerActive(id: number, isActive: boolean): Promise<Result> {
  await assertHomeAdmin();
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Invalid banner" };
  await db.update(homeBanners).set({ isActive: isActive === true }).where(eq(homeBanners.id, id));
  return done();
}

export async function moveBanner(id: number, direction: -1 | 1): Promise<Result> {
  await assertHomeAdmin();
  if (!idSchema.safeParse(id).success || (direction !== -1 && direction !== 1)) {
    return { ok: false, error: "Invalid request" };
  }
  const rows = await db
    .select({ id: homeBanners.id })
    .from(homeBanners)
    .orderBy(asc(homeBanners.sortOrder), asc(homeBanners.id));
  const i = rows.findIndex((r) => r.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= rows.length) return done();
  [rows[i], rows[j]] = [rows[j], rows[i]];

  await db.transaction(async (tx) => {
    for (let k = 0; k < rows.length; k++) {
      await tx.update(homeBanners).set({ sortOrder: k + 1 }).where(eq(homeBanners.id, rows[k].id));
    }
  });
  return done();
}

export async function saveVideo(input: unknown): Promise<Result> {
  await assertHomeAdmin();
  const parsed = videoSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error);
  await db
    .insert(homeVideo)
    .values({ id: 1, ...parsed.data })
    .onConflictDoUpdate({ target: homeVideo.id, set: parsed.data });
  return done();
}
