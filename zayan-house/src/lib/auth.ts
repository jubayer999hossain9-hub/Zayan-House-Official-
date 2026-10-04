import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, admins, customers } from "@/db/schema";
import { readSession } from "./session";

/** A session is revoked if the password was changed after the session was issued. */
function sessionRevoked(passwordChangedAt: Date | null, issuedAtSeconds: number) {
  return !!passwordChangedAt && issuedAtSeconds < Math.floor(passwordChangedAt.getTime() / 1000);
}

/** Current logged-in customer (or null). Always re-checked against the database. */
export const getCurrentCustomer = cache(async () => {
  const session = await readSession("customer");
  if (!session) return null;
  const userId = session.userId;
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      passwordChangedAt: users.passwordChangedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row || !row.isActive || row.role !== "customer" || sessionRevoked(row.passwordChangedAt, session.issuedAt)) return null;
  const [customer] = await db.select({ id: customers.id }).from(customers).where(eq(customers.userId, row.id)).limit(1);
  return { id: row.id, name: row.name, email: row.email, phone: row.phone, customerId: customer?.id ?? null };
});

/** Current logged-in admin (or null). Requires both an admin session AND an admins row. */
export const getCurrentAdmin = cache(async () => {
  const session = await readSession("admin");
  if (!session) return null;
  const userId = session.userId;
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      adminRole: admins.adminRole,
      passwordChangedAt: users.passwordChangedAt,
    })
    .from(users)
    .innerJoin(admins, eq(admins.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);
  if (!row || !row.isActive || row.role !== "admin" || sessionRevoked(row.passwordChangedAt, session.issuedAt)) return null;
  const { passwordChangedAt: _unused, ...admin } = row;
  void _unused;
  return admin;
});

export async function requireCustomer() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");
  return customer;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
