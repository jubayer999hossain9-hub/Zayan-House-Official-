import "server-only";
// Open any existing admin action in src/app/actions/ and look at how it checks
// the admin at the top of a function. Use the SAME import and call here.
import { requireAdmin } from "@/lib/auth";

export async function assertHomeAdmin() {
  await requireAdmin();
}
