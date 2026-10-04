import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { loginCustomer } from "@/app/actions/auth";
import { getCurrentCustomer } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/validation";

export const metadata: Metadata = { title: "Login", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = safeRedirectPath(next, "/account");
  if (await getCurrentCustomer()) redirect(safeNext);
  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:py-20">
      <h1 className="text-center text-4xl text-green">Welcome back</h1>
      <p className="mt-2 text-center text-sm text-muted">Log in to view your orders and saved addresses.</p>
      <div className="mt-8 border border-line bg-cream p-6 shadow-soft sm:p-8">
        <AuthForm
          action={loginCustomer}
          submitLabel="Log in"
          next={safeNext}
          fields={[
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
          ]}
        />
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        New to Zayan House? <Link href="/register" className="font-semibold text-green underline">Create an account</Link>
      </p>
    </section>
  );
}
