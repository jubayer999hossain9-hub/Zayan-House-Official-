import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { loginAdmin } from "@/app/actions/auth";
import { getCurrentAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin Login" };

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-screen items-center justify-center bg-green px-4 py-10">
      <div className="w-full max-w-sm bg-cream p-8 shadow-soft">
        <Image unoptimized src="/logo.png" alt="Zayan House" width={80} height={80} className="mx-auto h-16 w-auto" />
        <h1 className="mt-4 text-center text-2xl text-green">Admin Login</h1>
        <p className="mb-6 mt-1 text-center text-xs uppercase tracking-[0.18em] text-muted">Authorized staff only</p>
        <AuthForm
          action={loginAdmin}
          submitLabel="Log in"
          fields={[
            { name: "email", label: "Email", type: "email", autoComplete: "username" },
            { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
          ]}
        />
      </div>
    </div>
  );
}
