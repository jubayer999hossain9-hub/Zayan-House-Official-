import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { registerCustomer } from "@/app/actions/auth";
import { getCurrentCustomer } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/validation";

export const metadata: Metadata = { title: "Create Account", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = safeRedirectPath(next, "/account");
  if (await getCurrentCustomer()) redirect(safeNext);
  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:py-20">
      <h1 className="text-center text-4xl text-green">Create your account</h1>
      <p className="mt-2 text-center text-sm text-muted">Track orders and check out faster.</p>
      <div className="mt-8 border border-line bg-cream p-6 shadow-soft sm:p-8">
        <AuthForm
          action={registerCustomer}
          submitLabel="Create account"
          next={safeNext}
          fields={[
            { name: "name", label: "Full name", autoComplete: "name" },
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            { name: "phone", label: "Mobile number", type: "tel", autoComplete: "tel", placeholder: "01XXXXXXXXX" },
            { name: "password", label: "Password (min 8 characters)", type: "password", autoComplete: "new-password" },
            { name: "confirmPassword", label: "Confirm password", type: "password", autoComplete: "new-password" },
          ]}
        />
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account? <Link href="/login" className="font-semibold text-green underline">Log in</Link>
      </p>
    </section>
  );
}
