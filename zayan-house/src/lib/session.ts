import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type SessionKind = "customer" | "admin";

const COOKIE_NAMES: Record<SessionKind, string> = {
  customer: "zh_session",
  admin: "zh_admin_session",
};

// Admin sessions are shorter than customer sessions.
const MAX_AGE: Record<SessionKind, number> = {
  customer: 60 * 60 * 24 * 30,
  admin: 60 * 60 * 8,
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or too short (needs at least 32 characters). See .env.example.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(kind: SessionKind, userId: number) {
  const token = await new SignJWT({ kind })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE[kind]}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(COOKIE_NAMES[kind], token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE[kind],
  });
}

export async function readSession(kind: SessionKind): Promise<{ userId: number; issuedAt: number } | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAMES[kind])?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.kind !== kind || !payload.sub) return null;
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || typeof payload.iat !== "number") return null;
    return { userId, issuedAt: payload.iat };
  } catch {
    return null;
  }
}

export async function destroySession(kind: SessionKind) {
  const store = await cookies();
  store.delete(COOKIE_NAMES[kind]);
}
