"use server";

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, customers, admins } from "@/db/schema";
import { hashPassword, verifyPassword, getDummyHash } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  loginSchema,
  registerSchema,
  zodFieldErrors,
  safeRedirectPath,
  type FormState,
} from "@/lib/validation";

const BAD_LOGIN = "Incorrect email or password.";
const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";

export async function loginCustomer(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };
  const { email, password } = parsed.data;

  const ip = await clientIp();
  const allowed =
    (await rateLimit(`login:ip:${ip}`, 30, 600)) && (await rateLimit(`login:email:${email}`, 8, 600));
  if (!allowed) return { error: TOO_MANY };

  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  const valid = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !valid || !user.isActive || user.role !== "customer") return { error: BAD_LOGIN };

  await createSession("customer", user.id);
  redirect(safeRedirectPath(formData.get("next"), "/account"));
}

export async function registerCustomer(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };
  const { name, email, phone, password } = parsed.data;

  const ip = await clientIp();
  if (!(await rateLimit(`register:ip:${ip}`, 10, 3600))) return { error: TOO_MANY };

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);
  if (existing) return { fieldErrors: { email: "An account with this email already exists. Please log in." } };

  const passwordHash = await hashPassword(password);

  try {
    const userId = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ email, name, phone, passwordHash, role: "customer" })
        .returning({ id: users.id });

      // Link to an existing guest customer with the same phone (from earlier guest orders), else create one.
      const [guest] = await tx
        .select({ id: customers.id, userId: customers.userId })
        .from(customers)
        .where(eq(customers.phone, phone))
        .limit(1);
      if (guest && !guest.userId) {
        await tx.update(customers).set({ userId: user.id, name, email }).where(eq(customers.id, guest.id));
      } else {
        await tx.insert(customers).values({ userId: user.id, name, phone, email });
      }
      return user.id;
    });
    await createSession("customer", userId);
  } catch (error) {
    console.error("Registration failed:", error);
    return { error: "We could not create your account. Please try again." };
  }
  redirect(safeRedirectPath(formData.get("next"), "/account"));
}

export async function logoutCustomer() {
  await destroySession("customer");
  redirect("/");
}

export async function loginAdmin(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };
  const { email, password } = parsed.data;

  const ip = await clientIp();
  const allowed =
    (await rateLimit(`admin-login:ip:${ip}`, 15, 900)) && (await rateLimit(`admin-login:email:${email}`, 5, 900));
  if (!allowed) return { error: TOO_MANY };

  const [row] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      isActive: users.isActive,
      role: users.role,
      adminId: admins.id,
    })
    .from(users)
    .leftJoin(admins, eq(admins.userId, users.id))
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  const valid = await verifyPassword(password, row?.passwordHash ?? (await getDummyHash()));
  if (!row || !valid || !row.isActive || row.role !== "admin" || !row.adminId) return { error: BAD_LOGIN };

  await createSession("admin", row.id);
  redirect("/admin");
}

export async function logoutAdmin() {
  await destroySession("admin");
  redirect("/admin/login");
}
