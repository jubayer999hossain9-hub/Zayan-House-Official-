"use server";

import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { emailSchema, type FormState } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Please enter a valid email address." };
  const ip = await clientIp();
  if (!(await rateLimit(`newsletter:${ip}`, 5, 3600))) return { error: "Too many attempts. Please try again later." };
  try {
    await db.insert(newsletterSubscribers).values({ email: parsed.data }).onConflictDoNothing();
    return { ok: true };
  } catch (error) {
    console.error("newsletter failed:", error);
    return { error: "Could not subscribe right now. Please try again." };
  }
}
