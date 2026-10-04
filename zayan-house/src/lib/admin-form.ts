import "server-only";
import { redirect } from "next/navigation";
import { requireAdmin } from "./auth";

/** Every admin server action starts here, so a logged-out or non-admin request can never change data. */
export async function adminOnly() {
  return requireAdmin();
}

export function flashRedirect(path: string, kind: "ok" | "error", message: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${kind}=${encodeURIComponent(message)}`);
}

/** Detects a PostgreSQL unique-constraint violation and which column. */
export function uniqueViolation(error: unknown): string | null {
  const e = error as { code?: string; constraint?: string; cause?: { code?: string; constraint?: string } };
  const code = e?.code ?? e?.cause?.code;
  if (code !== "23505") return null;
  return e?.constraint ?? e?.cause?.constraint ?? "unique";
}
