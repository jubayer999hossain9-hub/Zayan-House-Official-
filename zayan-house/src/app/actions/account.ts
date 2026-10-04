"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, asc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, customers, customerAddresses } from "@/db/schema";
import { requireCustomer } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { DISTRICTS } from "@/lib/districts";
import { phoneSchema, passwordSchema, zodFieldErrors, type FormState } from "@/lib/validation";

const MAX_ADDRESSES = 10;

/** Makes sure the logged-in user has a customer record and returns its id. */
async function ensureCustomerId(user: Awaited<ReturnType<typeof requireCustomer>>): Promise<number> {
  if (user.customerId != null) return user.customerId;
  const [row] = await db
    .insert(customers)
    .values({ userId: user.id, name: user.name, phone: user.phone ?? "", email: user.email })
    .returning({ id: customers.id });
  return row.id;
}

const optional = (max: number) =>
  z.string().trim().max(max).transform((v) => (v === "" ? null : v));

const addressSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  label: z.string().trim().min(1, "Give this address a name, e.g. Home").max(30),
  fullName: z.string().trim().min(2, "Enter the recipient's name").max(100),
  phone: phoneSchema,
  address: z.string().trim().min(5, "Enter the full address").max(300),
  area: optional(100),
  city: z.string().trim().min(2, "Enter your city or upazila").max(100),
  district: z.enum(DISTRICTS, { message: "Choose a district" }),
  postalCode: optional(10).refine((v) => v === null || /^\d{4}$/.test(v), "Postal code must be 4 digits"),
  isDefault: z.boolean(),
});

export async function saveAddress(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireCustomer();
  const idRaw = formData.get("id");
  const parsed = addressSchema.safeParse({
    id: idRaw ? idRaw : undefined,
    label: formData.get("label"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    area: formData.get("area") ?? "",
    city: formData.get("city"),
    district: formData.get("district"),
    postalCode: formData.get("postalCode") ?? "",
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };
  const { id, isDefault, ...fields } = parsed.data;
  const customerId = await ensureCustomerId(user);

  try {
    await db.transaction(async (tx) => {
      const existing = await tx.select({ id: customerAddresses.id }).from(customerAddresses).where(eq(customerAddresses.customerId, customerId));
      let savedId: number;
      if (id) {
        const updated = await tx
          .update(customerAddresses)
          .set(fields)
          .where(and(eq(customerAddresses.id, id), eq(customerAddresses.customerId, customerId)))
          .returning({ id: customerAddresses.id });
        if (updated.length === 0) throw new Error("NOT_FOUND");
        savedId = id;
      } else {
        if (existing.length >= MAX_ADDRESSES) throw new Error("LIMIT");
        const [created] = await tx
          .insert(customerAddresses)
          .values({ ...fields, customerId, isDefault: false })
          .returning({ id: customerAddresses.id });
        savedId = created.id;
      }
      if (isDefault || existing.length === 0) {
        await tx.update(customerAddresses).set({ isDefault: false }).where(and(eq(customerAddresses.customerId, customerId), ne(customerAddresses.id, savedId)));
        await tx.update(customerAddresses).set({ isDefault: true }).where(eq(customerAddresses.id, savedId));
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "LIMIT") return { error: `You can save up to ${MAX_ADDRESSES} addresses. Please delete one first.` };
    if (error instanceof Error && error.message === "NOT_FOUND") return { error: "That address could not be found." };
    console.error("saveAddress failed:", error);
    return { error: "We could not save the address. Please try again." };
  }
  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function deleteAddress(formData: FormData) {
  const user = await requireCustomer();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0 || user.customerId == null) return;
  const customerId = user.customerId;
  await db.transaction(async (tx) => {
    const [gone] = await tx
      .delete(customerAddresses)
      .where(and(eq(customerAddresses.id, id), eq(customerAddresses.customerId, customerId)))
      .returning({ wasDefault: customerAddresses.isDefault });
    if (gone?.wasDefault) {
      const [next] = await tx.select({ id: customerAddresses.id }).from(customerAddresses).where(eq(customerAddresses.customerId, customerId)).orderBy(asc(customerAddresses.id)).limit(1);
      if (next) await tx.update(customerAddresses).set({ isDefault: true }).where(eq(customerAddresses.id, next.id));
    }
  });
  revalidatePath("/account/addresses");
}

export async function setDefaultAddress(formData: FormData) {
  const user = await requireCustomer();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0 || user.customerId == null) return;
  const customerId = user.customerId;
  await db.transaction(async (tx) => {
    const [target] = await tx.select({ id: customerAddresses.id }).from(customerAddresses).where(and(eq(customerAddresses.id, id), eq(customerAddresses.customerId, customerId))).limit(1);
    if (!target) return;
    await tx.update(customerAddresses).set({ isDefault: false }).where(eq(customerAddresses.customerId, customerId));
    await tx.update(customerAddresses).set({ isDefault: true }).where(eq(customerAddresses.id, id));
  });
  revalidatePath("/account/addresses");
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: phoneSchema,
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireCustomer();
  const parsed = profileSchema.safeParse({ name: formData.get("name"), phone: formData.get("phone") });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };
  const { name, phone } = parsed.data;
  try {
    await db.transaction(async (tx) => {
      await tx.update(users).set({ name, phone }).where(eq(users.id, user.id));
      await tx.update(customers).set({ name, phone }).where(eq(customers.userId, user.id));
    });
  } catch (error) {
    console.error("updateProfile failed:", error);
    return { error: "We could not update your profile. Please try again." };
  }
  revalidatePath("/account", "layout");
  return { ok: true };
}

const passwordChangeSchema = z
  .object({ current: z.string().min(1, "Enter your current password").max(100), next: passwordSchema, confirm: z.string() })
  .refine((d) => d.next === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireCustomer();
  const parsed = passwordChangeSchema.safeParse({
    current: formData.get("current"), next: formData.get("next"), confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };
  if (!(await rateLimit(`pwchange:${user.id}`, 5, 900))) return { error: "Too many attempts. Please wait a few minutes." };

  const [row] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!row || !(await verifyPassword(parsed.data.current, row.hash))) {
    return { fieldErrors: { current: "Your current password is incorrect." } };
  }
  const passwordHash = await hashPassword(parsed.data.next);
  await db.update(users).set({ passwordHash, passwordChangedAt: new Date() }).where(eq(users.id, user.id));
  // All other devices are logged out; this browser gets a fresh session.
  await createSession("customer", user.id);
  return { ok: true };
}
