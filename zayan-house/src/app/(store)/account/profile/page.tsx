import type { Metadata } from "next";
import { requireCustomer } from "@/lib/auth";
import { ProfileForm, PasswordForm } from "@/components/profile-forms";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const customer = await requireCustomer();
  return (
    <div>
      <h1 className="text-4xl text-green">Profile</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ProfileForm name={customer.name} phone={customer.phone ?? ""} email={customer.email} />
        <PasswordForm />
      </div>
    </div>
  );
}
