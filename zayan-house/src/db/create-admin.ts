/**
 * Creates (or resets the password of) an admin account.
 *   npm run admin:create
 * It asks for name, email and password. Nothing is hardcoded and no default admin exists.
 */
import readline from "node:readline";
import { sql, eq } from "drizzle-orm";
import { connectScript } from "./standalone";
import { users, admins } from "./schema";
import { hashPassword } from "../lib/password";

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      const rlAny = rl as unknown as { _writeToOutput: (s: string) => void };
      rlAny._writeToOutput = (s: string) => {
        if (s.includes(question)) process.stdout.write(s);
        else if (s.includes("\n") || s.includes("\r")) process.stdout.write("\n");
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const { db, pool } = connectScript();

  const name = process.env.ADMIN_NAME || (await ask("Admin name: "));
  const email = (process.env.ADMIN_EMAIL || (await ask("Admin email: "))).toLowerCase();
  const password = process.env.ADMIN_PASSWORD || (await ask("Admin password (min 12 characters): ", true));

  if (name.length < 2) throw new Error("Name is too short.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Email looks invalid.");
  if (password.length < 12) throw new Error("Password must be at least 12 characters.");

  const passwordHash = await hashPassword(password);

  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);

    let userId: number;
    if (existing) {
      if (existing.role !== "admin") {
        throw new Error("That email belongs to a customer account. Use a different email for the admin.");
      }
      await tx.update(users).set({ name, passwordHash, isActive: true, passwordChangedAt: new Date() }).where(eq(users.id, existing.id));
      userId = existing.id;
    } else {
      const [created] = await tx
        .insert(users)
        .values({ email, name, passwordHash, role: "admin" })
        .returning({ id: users.id });
      userId = created.id;
    }
    await tx.insert(admins).values({ userId, adminRole: "super_admin" }).onConflictDoNothing({ target: admins.userId });
  });

  console.log(`\nAdmin ready: ${email}\nLog in at /admin/login`);
  await pool.end();
}

main().catch((e) => {
  console.error("\nFailed:", e.message);
  process.exit(1);
});
