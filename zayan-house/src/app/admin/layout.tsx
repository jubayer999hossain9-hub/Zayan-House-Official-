import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logoutAdmin } from "@/app/actions/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-ivory lg:flex">
      <aside className="sticky top-0 z-40 bg-green text-cream shadow-soft lg:h-screen lg:w-60 lg:shrink-0 lg:overflow-y-auto lg:shadow-none">
        <AdminSidebar />
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-line bg-cream px-4 py-3 sm:px-5">
          <Link href="/" target="_blank" className="text-sm text-green underline">View storefront</Link>
          <div className="flex items-center gap-3 text-sm sm:gap-4">
            <span className="hidden text-muted sm:inline">{admin.name}</span>
            <form action={logoutAdmin}><button type="submit" className="font-semibold text-green underline">Log out</button></form>
          </div>
        </header>
        <div className="mx-auto max-w-7xl overflow-x-auto p-4 sm:p-8">{children}</div>
      </div>
    </div>
  );
}